// @ts-nocheck
"use client";
import React, { ReactNode, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { GrPowerCycle } from "react-icons/gr";
import { BiClipboard, BiCheck } from "react-icons/bi";
import DiscordTimestampTable from "./table";

export default function Form() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeZone, setTimeZone] = useState<string>("UTC");

  useEffect(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(userTimeZone);
  }, []);

  const onSubmit = async (data: { naturalLanguage: string }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/GenerateUnixTimestamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: data.naturalLanguage, timeZone }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to generate timestamp");
      }

      if (
        typeof responseData.timestamp !== "number" ||
        isNaN(responseData.timestamp)
      ) {
        throw new Error("Invalid timestamp received");
      }

      setResult(responseData.timestamp);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopiedSubmit = () => {
    navigator.clipboard.writeText(result?.toString());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="mx-auto p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold mb-4">UNIX Timestamp Generator</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="naturalLanguage"
            className="block text-sm font-medium text-gray-700"
          >
            Enter date/time in natural language
          </label>
          <input
            id="naturalLanguage"
            type="text"
            {...register("naturalLanguage", {
              required: "This field is required",
            })}
            className="mt-3 block py-2 pl-2 w-full rounded-md bg-neutral-50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-50"
            placeholder="next Friday at 3pm"
          />
          {errors.naturalLanguage && (
            <p className="mt-1 text-sm text-red-600">
              {errors.naturalLanguage.message}
            </p>
          )}
        </div>
        <RoundedSlideButton type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Timestamp"}
        </RoundedSlideButton>
      </form>
      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      {result !== null && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Result:</h2>
          <div className="w-full p-2 rounded font-mono bg-gray-100 flex items-center justify-between">
            <p className="text-xl">{result}</p>
            <button onClick={handleCopiedSubmit}>
              {copied ? (
                <BiCheck className="text-emerald-600" />
              ) : (
                <BiClipboard className="hover:text-zinc-500 transition-colors duration-200 ease-in-out" />
              )}
            </button>
          </div>
          <p className="mt-2 text-md">
            {new Date(result * 1000).toLocaleString()}
          </p>
        </div>
      )}

      <DiscordTimestampTable timestamp={result} timeZone={timeZone} />
    </div>
  );
}

const RoundedSlideButton = ({
  type,
  disabled,
  children,
  onClick,
}: {
  type: string;
  disabled: boolean;
  children: ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        relative w-full z-0 flex items-center justify-center gap-2 overflow-hidden rounded-lg border-[1px] 
        border-zinc-400 px-4 py-2 font-semibold
        uppercase text-zinc-900 transition-all duration-500
        
        before:absolute before:inset-0
        before:-z-10 before:translate-x-[150%]
        before:translate-y-[150%] before:scale-[2.5]
        before:rounded-[100%] before:bg-zinc-800
        before:transition-transform before:duration-1000
        before:content-[""]

        hover:scale-105 hover:text-zinc-100
        hover:before:translate-x-[0%]
        hover:before:translate-y-[0%]
        active:scale-95`}
    >
      <GrPowerCycle />
      <span>{children}</span>
    </button>
  );
};
