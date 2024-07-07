import React, { useState } from "react";
import { BiClipboard, BiCheck } from "react-icons/bi";
import { formatInTimeZone } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

interface TableRow {
  style: string;
  format: string;
  example: string;
  output12Hour: string;
}

interface DiscordTimestampTableProps {
  timestamp: number | null;
  timeZone: string;
}

const DiscordTimestampTable: React.FC<DiscordTimestampTableProps> = ({
  timestamp,
  timeZone,
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
        return formatInTimeZone(date, timeZone, "h:mm a", { locale: enUS });
      case "T":
        return formatInTimeZone(date, timeZone, "h:mm:ss a", { locale: enUS });
      case "d":
        return formatInTimeZone(date, timeZone, "MM/dd/yyyy", { locale: enUS });
      case "D":
        return formatInTimeZone(date, timeZone, "MMMM d, yyyy", {
          locale: enUS,
        });
      case "f":
      case undefined:
        return formatInTimeZone(date, timeZone, "MMMM d, yyyy h:mm a", {
          locale: enUS,
        });
      case "F":
        return formatInTimeZone(date, timeZone, "EEEE, MMMM d, yyyy h:mm a", {
          locale: enUS,
        });
      case "R":
        const diff = date.getTime() - now.getTime();
        const absDiff = Math.abs(diff);
        const isFuture = diff > 0;

        if (absDiff < 60000) {
          // less than a minute
          return isFuture ? "in a few seconds" : "a few seconds ago";
        }

        const distance = formatDistanceToNow(date, {
          locale: enUS,
          addSuffix: true,
        });
        return isFuture ? distance.replace("about ", "") : distance;
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
      <p className="mb-2">Time Zone: {timeZone}</p>
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
