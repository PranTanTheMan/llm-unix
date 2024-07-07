import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  ClaudeResponse,
  TimestampResponse,
  ErrorResponse,
} from "@/types/claude";
import { toZonedTime, format } from "date-fns-tz";
import { parse, parseISO } from "date-fns";

export const runtime = "edge";

function parseDateTime(input: string, timeZone: string): Date {
  console.log("Parsing input:", input);
  const lowerInput = input.toLowerCase();

  // Try parsing as an absolute date first
  try {
    const parsedDate = toZonedTime(new Date(input), timeZone);
    if (!isNaN(parsedDate.getTime())) {
      console.log("Parsed as absolute date:", parsedDate);
      return parsedDate;
    }
  } catch (error) {
    console.log("Failed to parse as absolute date, trying relative parsing");
  }

  // Relative date parsing
  const now = toZonedTime(new Date(), timeZone);
  let parsedDate: Date;

  if (lowerInput.includes("today")) {
    console.log("Parsing as today");
    parsedDate = parse(lowerInput, "yyyy-MM-dd HH:mm", now);
  } else if (lowerInput.includes("tomorrow")) {
    console.log("Parsing as tomorrow");
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    parsedDate = parse(lowerInput, "yyyy-MM-dd HH:mm", tomorrow);
  } else if (lowerInput.includes("next")) {
    console.log("Parsing as next day of week");
    const daysOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayIndex = daysOfWeek.findIndex((day) => lowerInput.includes(day));
    if (dayIndex !== -1) {
      const daysUntilNext = (dayIndex + 7 - now.getDay()) % 7 || 7;
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + daysUntilNext);
      parsedDate = parse(lowerInput, "yyyy-MM-dd HH:mm", nextDay);
    } else {
      throw new Error("Unable to parse date and time");
    }
  } else {
    throw new Error("Unable to parse date and time");
  }

  if (isNaN(parsedDate.getTime())) {
    throw new Error("Unable to parse date and time");
  }

  return toZonedTime(parsedDate, timeZone);
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<TimestampResponse | ErrorResponse>> {
  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    const { input, timeZone } = await req.json();

    if (!input) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    console.log("Received input:", input);

    try {
      const parsedDate = parseDateTime(input, timeZone);
      const timestamp = Math.floor(parsedDate.getTime() / 1000);
      console.log("Generated UNIX timestamp:", timestamp);
      if (isNaN(timestamp)) {
        throw new Error("Generated timestamp is NaN");
      }
      return NextResponse.json({ timestamp });
    } catch (parseError) {
      console.log("Failed to parse locally, falling back to Claude API");

      const completion = (await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Parse the following date/time: "${input}". If it's relative (like 'next Thursday'), calculate the actual date based on today's date (${new Date().toISOString()}). Return only the parsed date and time in the format "YYYY-MM-DD HH:mm:ss", nothing else.`,
          },
        ],
      })) as ClaudeResponse;

      console.log("Received response from Claude API:", completion);

      if (
        completion.content &&
        completion.content[0] &&
        completion.content[0].type === "text"
      ) {
        const extractedDateTime = completion.content[0].text.trim();
        console.log("Extracted date and time:", extractedDateTime);

        const parsedDate = toZonedTime(parseISO(extractedDateTime), timeZone);
        const timestamp = Math.floor(parsedDate.getTime() / 1000);

        if (isNaN(timestamp)) {
          console.error("Failed to parse date and time:", extractedDateTime);
          return NextResponse.json(
            { error: "Could not parse the date and time" },
            { status: 400 }
          );
        }

        console.log("Generated UNIX timestamp:", timestamp);
        return NextResponse.json({ timestamp });
      } else {
        console.error(
          "Unexpected response format from Claude API:",
          completion
        );
        return NextResponse.json(
          { error: "Unexpected response format from Claude API" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
