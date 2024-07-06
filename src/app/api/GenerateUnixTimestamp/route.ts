import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  ClaudeResponse,
  TimestampResponse,
  ErrorResponse,
} from "@/types/claude";

export const runtime = "edge";

function parseDateTime(input: string): Date {
  console.log("Parsing input:", input);
  const now = new Date();
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("today")) {
    console.log("Parsing as today");
    const timePart = lowerInput.split("at")[1]?.trim() || "00:00";
    return parseTimeAndSetToDate(now, timePart);
  }

  if (lowerInput.includes("tomorrow")) {
    console.log("Parsing as tomorrow");
    now.setDate(now.getDate() + 1);
    const timePart = lowerInput.split("at")[1]?.trim() || "00:00";
    return parseTimeAndSetToDate(now, timePart);
  }

  if (lowerInput.includes("next")) {
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
      now.setDate(now.getDate() + daysUntilNext);
      const timePart = lowerInput.split("at")[1]?.trim() || "00:00";
      return parseTimeAndSetToDate(now, timePart);
    }
  }

  console.log("Attempting to parse as absolute date");
  const parsedDate = new Date(input);
  if (!isNaN(parsedDate.getTime())) {
    console.log("Parsed as absolute date:", parsedDate);
    return parsedDate;
  }

  console.log("Failed to parse date");
  throw new Error("Unable to parse date and time");
}

function parseTimeAndSetToDate(date: Date, timePart: string): Date {
  const timeMatch = timePart.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || "0");
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === "pm" && hours < 12) {
      hours += 12;
    } else if (ampm === "am" && hours === 12) {
      hours = 0;
    }

    date.setHours(hours, minutes, 0, 0);
  }
  console.log("Parsed date:", date);
  return date;
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

    const { input } = await req.json();

    if (!input) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    console.log("Received input:", input);

    try {
      const parsedDate = parseDateTime(input);
      const timestamp = Math.floor(parsedDate.getTime() / 1000);
      console.log("Generated UNIX timestamp:", timestamp);
      if (isNaN(timestamp)) {
        throw new Error("Generated timestamp is NaN");
      }
      return NextResponse.json({ timestamp });
    } catch (parseError) {
      console.log("Failed to parse locally, falling back to Claude API");

      const completion = (await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Parse the following date/time: "${input}". If it's relative (like 'next Thursday'), calculate the actual date based on today's date (${new Date().toISOString()}). Return only the parsed date and time in the format "YYYY-MM-DD HH:MM:SS", nothing else.`,
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

        const timestamp = Math.floor(
          new Date(extractedDateTime).getTime() / 1000
        );

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
