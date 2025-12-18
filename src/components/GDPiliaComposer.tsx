import React, { useState, useEffect } from "react";
import { Lead } from "../services/leadsService";
import { useAuth } from "../contexts/AuthContext";
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
  const { currentUser } = useAuth();
  const [messageType, setMessageType] = useState<"linkedin" | "email">(
    "email"
  );
  const [topic, setTopic] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "fr">("en");

  const translations = {
    en: {
      gdpiliaComposer: "GDPilia Composer",
      email: "Email",
      linkedin: "LinkedIn",
      topicLabel: "Topic",
      topicPlaceholder: "Please choose an option",
      subjectLabel: "Subject",
      messageLabel: "Message",
      cancelButton: "Cancel",
      copyButton: "Copy",
      sendButton: "Send",
      topics: [
        { value: "ask_for_contact", label: "Ask for contact" },
        { value: "plan_rendez_vous", label: "Plan a rendez-vous" },
        { value: "follow_up", label: "Follow-up" },
        { value: "custom", label: "Custom message" },
      ],
      connectionRequestSubject: "Connection Request",
      connectionRequestMessage: `Dear {fullName},\n\nI came across your profile and was impressed by your work at {company}. I'd like to connect with you.\n\nBest regards,\n{userName}`,
      meetingRequestSubject: "Meeting Request",
      meetingRequestMessage: `Dear {fullName},\n\nI hope this email finds you well. I would like to schedule a brief meeting to discuss potential collaboration. Please let me know what time works best for you.\n\nBest regards,\n{userName}`,
      followingUpSubject: "Following Up",
      followingUpMessage: `Dear {fullName},\n\nI'm writing to follow up on our recent conversation. I'm looking forward to hearing from you.\n\nBest regards,\n{userName}`,
      linkedinConnectionRequest: `Hi {fullName}, I came across your profile and was impressed by your work at {company}. I'd like to connect with you.`,
      linkedinMeetingRequest: `Hi {fullName}, I'd like to schedule a brief meeting to discuss potential collaboration. Please let me know what time works best for you.`,
      linkedinFollowingUp: `Hi {fullName}, just following up on our recent conversation. Looking forward to hearing from you.`,
    },
    fr: {
      gdpiliaComposer: "GDPilia Composer",
      email: "Email",
      linkedin: "LinkedIn",
      topicLabel: "Objet",
      topicPlaceholder: "Veuillez choisir une option",
      subjectLabel: "Sujet",
      messageLabel: "Message",
      cancelButton: "Annuler",
      copyButton: "Copier",
      sendButton: "Envoyer",
      topics: [
        { value: "ask_for_contact", label: "Demande de contact" },
        { value: "plan_rendez_vous", label: "Planifier un rendez-vous" },
        { value: "follow_up", label: "Suivi" },
        { value: "custom", label: "Message personnalisé" },
      ],
      connectionRequestSubject: "Demande de connexion",
      connectionRequestMessage: `Cher {fullName},\n\nJ'ai découvert votre profil et j'ai été impressionné par votre travail chez {company}. J'aimerais me connecter avec vous.\n\nCordialement,\n{userName}`,
      meetingRequestSubject: "Demande de réunion",
      meetingRequestMessage: `Cher {fullName},\n\nJ'espère que cet e-mail vous trouve bien. J'aimerais organiser une brève réunion pour discuter d'une éventuelle collaboration. Veuillez me faire savoir quel moment vous convient le mieux.\n\nCordialement,\n{userName}`,
      followingUpSubject: "Suivi",
      followingUpMessage: `Cher {fullName},\n\nJe vous écris pour faire suite à notre récente conversation. J'attends de vos nouvelles avec impatience.\n\nCordialement,\n{userName}`,
      linkedinConnectionRequest: `Salut {fullName}, j'ai découvert votre profil et j'ai été impressionné par votre travail chez {company}. J'aimerais me connecter avec vous.`,
      linkedinMeetingRequest: `Salut {fullName}, j'aimerais organiser une brève réunion pour discuter d'une éventuelle collaboration. Veuillez me faire savoir quel moment vous convient le mieux.`,
      linkedinFollowingUp: `Salut {fullName}, juste pour faire suite à notre récente conversation. Au plaisir de vous lire.`,
    },
  };

  const t = translations[language];

  useEffect(() => {
    if (lead && currentUser) {
      let newSubject = "";
      let newMessage = "";
      if (messageType === "email") {
        switch (topic) {
          case "ask_for_contact":
            newSubject = t.connectionRequestSubject;
            newMessage = t.connectionRequestMessage
              .replace("{fullName}", lead.full_name)
              .replace("{company}", lead.company)
              .replace("{userName}", currentUser.name);
            break;
          case "plan_rendez_vous":
            newSubject = t.meetingRequestSubject;
            newMessage = t.meetingRequestMessage
              .replace("{fullName}", lead.full_name)
              .replace("{userName}", currentUser.name);
            break;
          case "follow_up":
            newSubject = t.followingUpSubject;
            newMessage = t.followingUpMessage
              .replace("{fullName}", lead.full_name)
              .replace("{userName}", currentUser.name);
            break;
          default:
            newSubject = "";
            newMessage = "";
        }
      } else {
        switch (topic) {
          case "ask_for_contact":
            newMessage = t.linkedinConnectionRequest
              .replace("{fullName}", lead.full_name)
              .replace("{company}", lead.company);
            break;
          case "plan_rendez_vous":
            newMessage = t.linkedinMeetingRequest.replace(
              "{fullName}",
              lead.full_name
            );
            break;
          case "follow_up":
            newMessage = t.linkedinFollowingUp.replace(
              "{fullName}",
              lead.full_name
            );
            break;
          default:
            newMessage = "";
        }
      }
      setSubject(newSubject);
      setMessage(newMessage);
    }
  }, [topic, messageType, lead, currentUser, t]);

  if (!isOpen || !lead) {
    return null;
  }
  const handleSend = () => {
    if (messageType === "email") {
      window.location.href = `mailto:${
        lead.email
      }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        message
      )}`;
    } else {
      window.open(lead.profile_url, "_blank");
    }
  };
  const handleCopy = () => {
    if (messageType === "email") {
      navigator.clipboard.writeText(`Subject: ${subject}\n\n${message}`);
    } else {
      navigator.clipboard.writeText(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {t.gdpiliaComposer}
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
                <span className="ml-2 text-gray-700">{t.email}</span>
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
                <span className="ml-2 text-gray-700">{t.linkedin}</span>
              </label>
            </div>
            <div className="flex items-center space-x-4 mt-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={language === "en"}
                  onChange={() => setLanguage("en")}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">English</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="language"
                  value="fr"
                  checked={language === "fr"}
                  onChange={() => setLanguage("fr")}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">French</span>
              </label>
            </div>
          </div>
          <div className="mb-6">
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.topicLabel}
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t.topicPlaceholder}</option>
              {t.topics.map((topic) => (
                <option key={topic.value} value={topic.value}>
                  {topic.label}
                </option>
              ))}
            </select>
          </div>
          {topic && (
            <div>
              {messageType === "email" && (
                <div className="mb-4">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t.subjectLabel}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.messageLabel}
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
            {t.cancelButton}
          </button>
          <button
            onClick={handleCopy}
            className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
          >
            {t.copyButton}
          </button>
          <button
            onClick={handleSend}
            className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
          >
            {t.sendButton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GDPiliaComposer;
