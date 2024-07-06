// @ts-nocheck
"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

export default function Form() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: { naturalLanguage: string }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/GenerateUnixTimestamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: data.naturalLanguage }),
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

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="e.g., next Friday at 3pm"
          />
          {errors.naturalLanguage && (
            <p className="mt-1 text-sm text-red-600">
              {errors.naturalLanguage.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? "Generating..." : "Generate Timestamp"}
        </button>
      </form>
      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      {result !== null && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Result:</h2>
          <p className="text-xl font-mono bg-gray-100 p-2 rounded">
            UNIX Timestamp: {result}
          </p>
          <p className="mt-2 text-md">
            {new Date(result * 1000).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
