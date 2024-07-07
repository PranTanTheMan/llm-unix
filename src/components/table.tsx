import React, { useState } from "react";
import { BiClipboard, BiCheck } from "react-icons/bi";

interface TableRow {
  style: string;
  format: string;
  example: string;
  output12Hour: string;
}

interface DiscordTimestampTableProps {
  timestamp: number | null;
}

const DiscordTimestampTable: React.FC<DiscordTimestampTableProps> = ({
  timestamp,
}) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );

  const formatTimestamp = (format?: string): string => {
    if (timestamp === null) return "N/A";
    return `<t:${timestamp}${format ? `:${format}` : ""}>`;
  };

  const getOutput12Hour = (format?: string): string => {
    if (timestamp === null) return "N/A";
    const date = new Date(timestamp * 1000);
    const now = new Date();

    switch (format) {
      case "t":
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      case "T":
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
      case "d":
        return date.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        });
      case "D":
        return date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      case "f":
      case undefined:
        return date.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      case "F":
        return date.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      case "R":
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(Math.abs(diff) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30.44);
        const years = Math.floor(months / 12);

        if (diff < 0) {
          if (seconds < 60) return "in a few seconds";
          if (minutes < 60)
            return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
          if (hours < 24) return `in ${hours} hour${hours !== 1 ? "s" : ""}`;
          if (days < 30) return `in ${days} day${days !== 1 ? "s" : ""}`;
          if (months < 12)
            return `in ${months} month${months !== 1 ? "s" : ""}`;
          return `in ${years} year${years !== 1 ? "s" : ""}`;
        } else {
          if (seconds < 60) return "a few seconds ago";
          if (minutes < 60)
            return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
          if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
          if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
          if (months < 12)
            return `${months} month${months !== 1 ? "s" : ""} ago`;
          return `${years} year${years !== 1 ? "s" : ""} ago`;
        }
      default:
        return "Invalid format";
    }
  };

  const tableData: TableRow[] = [
    {
      style: "Default",
      format: "",
      example: formatTimestamp(),
      output12Hour: getOutput12Hour(),
    },
    {
      style: "Short Time",
      format: "t",
      example: formatTimestamp("t"),
      output12Hour: getOutput12Hour("t"),
    },
    {
      style: "Long Time",
      format: "T",
      example: formatTimestamp("T"),
      output12Hour: getOutput12Hour("T"),
    },
    {
      style: "Short Date",
      format: "d",
      example: formatTimestamp("d"),
      output12Hour: getOutput12Hour("d"),
    },
    {
      style: "Long Date",
      format: "D",
      example: formatTimestamp("D"),
      output12Hour: getOutput12Hour("D"),
    },
    {
      style: "Short Date/Time",
      format: "f",
      example: formatTimestamp("f"),
      output12Hour: getOutput12Hour("f"),
    },
    {
      style: "Long Date/Time",
      format: "F",
      example: formatTimestamp("F"),
      output12Hour: getOutput12Hour("F"),
    },
    {
      style: "Relative Time",
      format: "R",
      example: formatTimestamp("R"),
      output12Hour: getOutput12Hour("R"),
    },
  ];

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [format]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [format]: false }));
    }, 2000);
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Discord Timestamp Formats</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Style</th>
            <th className="border p-2 text-left">Format</th>
            <th className="border p-2 text-left">Example</th>
            <th className="border p-2 text-left">Output (12-hour clock)</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row: TableRow) => (
            <tr key={row.style}>
              <td className="border p-2">{row.style}</td>
              <td className="border p-2">{row.format || "None"}</td>
              <td className="border p-2">
                <div className="flex items-center justify-between">
                  <code className="bg-gray-100 p-1 rounded">{row.example}</code>
                  <button
                    onClick={() => handleCopy(row.example, row.format)}
                    className="ml-2"
                  >
                    {copiedStates[row.format] ? (
                      <BiCheck className="text-emerald-600" />
                    ) : (
                      <BiClipboard className="hover:text-zinc-500 transition-colors duration-200 ease-in-out" />
                    )}
                  </button>
                </div>
              </td>
              <td className="border p-2">{row.output12Hour}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DiscordTimestampTable;
