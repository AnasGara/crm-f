import React, { useState, useEffect } from "react";
import { Lead } from "../services/leadsService";
import {
  XMarkIcon,
  UserCircleIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

interface GDPiliaComposerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

const GDPiliaComposer: React.FC<GDPiliaComposerProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const [messageType, setMessageType] = useState<"linkedin" | "email">(
    "email"
  );
  const [topic, setTopic] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const topics = [
    { value: "ask_for_contact", label: "Ask for contact" },
    { value: "plan_rendez_vous", label: "Plan a rendez-vous" },
    { value: "follow_up", label: "Follow-up" },
    { value: "custom", label: "Custom message" },
  ];

  useEffect(() => {
    if (lead) {
      let newMessage = "";
      switch (topic) {
        case "ask_for_contact":
          newMessage =
            messageType === "email"
              ? `Subject: Connection Request

Dear ${lead.full_name},

I came across your profile and was impressed by your work at ${lead.company}. I'd like to connect with you.

Best regards,
[Your Name]`
              : `Hi ${lead.full_name}, I came across your profile and was impressed by your work at ${lead.company}. I'd like to connect with you.`;
          break;
        case "plan_rendez_vous":
          newMessage =
            messageType === "email"
              ? `Subject: Meeting Request

Dear ${lead.full_name},

I hope this email finds you well. I would like to schedule a brief meeting to discuss potential collaboration. Please let me know what time works best for you.

Best regards,
[Your Name]`
              : `Hi ${lead.full_name}, I'd like to schedule a brief meeting to discuss potential collaboration. Please let me know what time works best for you.`;
          break;
        case "follow_up":
          newMessage =
            messageType === "email"
              ? `Subject: Following Up

Dear ${lead.full_name},

I'm writing to follow up on our recent conversation. I'm looking forward to hearing from you.

Best regards,
[Your Name]`
              : `Hi ${lead.full_name}, just following up on our recent conversation. Looking forward to hearing from you.`;
          break;
        default:
          newMessage = "";
      }
      setMessage(newMessage);
    }
  }, [topic, messageType, lead]);

  if (!isOpen || !lead) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            GDPilia Composer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <UserCircleIcon className="h-12 w-12 text-gray-400" />
            <div className="ml-4">
              <p className="font-semibold text-gray-800">{lead.full_name}</p>
              <p className="text-sm text-gray-500">{lead.email}</p>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="email"
                  checked={messageType === "email"}
                  onChange={() => setMessageType("email")}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="messageType"
                  value="linkedin"
                  checked={messageType === "linkedin"}
                  onChange={() => setMessageType("linkedin")}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">LinkedIn</span>
              </label>
            </div>
          </div>
          <div className="mb-6">
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select a topic
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a topic</option>
              {topics.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {topic && (
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default GDPiliaComposer;
