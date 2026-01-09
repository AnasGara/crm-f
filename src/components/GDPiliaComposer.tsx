// GDPiliaComposer.tsx

import React, { useState, useEffect, useRef } from "react";
import { Lead } from "../services/leadsService";
import { useAuth } from "../contexts/AuthContext";
import {
  XMarkIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  checkEmailCapability,
  sendEmailToLead,
  EmailCapability,
} from "../services/api/email";

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
  const [emailCapability, setEmailCapability] =
    useState<EmailCapability | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<any>(null);
  
  // Track if user has manually edited fields
  const [isSubjectEdited, setIsSubjectEdited] = useState<boolean>(false);
  const [isMessageEdited, setIsMessageEdited] = useState<boolean>(false);
  
  // Track initial render to prevent auto-update on first load
  const isInitialRender = useRef(true);

  useEffect(() => {
    const fetchEmailCapability = async () => {
      if (isOpen) {
        try {
          const capability = await checkEmailCapability();
          setEmailCapability(capability);
        } catch (error) {
          console.error("Failed to check email capability:", error);
          setEmailCapability({
            can_send_emails: false,
            provider_email: null,
            expires_at: null,
            message: "Error checking capability",
          });
        }
      }
    };

    fetchEmailCapability();
  }, [isOpen]);

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
      connectionRequestMessage: `Dear {{lead_name}},\n\nI came across your profile and was impressed by your work at {{company}}. I'd like to connect with you.\n\nBest regards,\n{{user_name}}`,
      meetingRequestSubject: "Meeting Request",
      meetingRequestMessage: `Dear {{lead_name}},\n\nI hope this email finds you well. I would like to schedule a brief meeting to discuss potential collaboration. Please let me know what time works best for you.\n\nBest regards,\n{{user_name}}`,
      followingUpSubject: "Following Up",
      followingUpMessage: `Dear {{lead_name}},\n\nI'm writing to follow up on our recent conversation. I'm looking forward to hearing from you.\n\nBest regards,\n{{user_name}}`,
      linkedinConnectionRequest: `Hi {{lead_name}}, I came across your profile and was impressed by your work at {{company}}. I'd like to connect with you.`,
      linkedinMeetingRequest: `Hi {{lead_name}}, I'd like to schedule a brief meeting to discuss potential collaboration. Please let me know what time works best for you.`,
      linkedinFollowingUp: `Hi {{lead_name}}, just following up on our recent conversation. Looking forward to hearing from you.`,
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
      connectionRequestMessage: `Cher {{lead_name}},\n\nJ'ai découvert votre profil et j'ai été impressionné par votre travail chez {{company}}. J'aimerais me connecter avec vous.\n\nCordialement,\n{{user_name}}`,
      meetingRequestSubject: "Demande de réunion",
      meetingRequestMessage: `Cher {{lead_name}},\n\nJ'espère que cet e-mail vous trouve bien. J'aimerais organiser une brève réunion pour discuter d'une éventuelle collaboration. Veuillez me faire savoir quel moment vous convient le mieux.\n\nCordialement,\n{{user_name}}`,
      followingUpSubject: "Suivi",
      followingUpMessage: `Cher {{lead_name}},\n\nJe vous écris pour faire suite à notre récente conversation. J'attends de vos nouvelles avec impatience.\n\nCordialement,\n{{user_name}}`,
      linkedinConnectionRequest: `Salut {{lead_name}}, j'ai découvert votre profil et j'ai été impressionné par votre travail chez {{company}}. J'aimerais me connecter avec vous.`,
      linkedinMeetingRequest: `Salut {{lead_name}}, j'aimerais organiser une brève réunion pour discuter d'une éventuelle collaboration. Veuillez me faire savoir quel moment vous convient le mieux.`,
      linkedinFollowingUp: `Salut {{lead_name}}, juste pour faire suite à notre récente conversation. Au plaisir de vous lire.`,
    },
  };

  const t = translations[language];

  // Generate template based on topic selection
  const generateTemplate = (currentTopic: string) => {
    if (!lead || !currentUser) return { subject: "", message: "" };

    let newSubject = "";
    let newMessage = "";

    if (messageType === "email") {
      switch (currentTopic) {
        case "ask_for_contact":
          newSubject = t.connectionRequestSubject;
          newMessage = t.connectionRequestMessage
            .replace(/{{lead_name}}/g, lead.full_name)
            .replace(/{{company}}/g, lead.company)
            .replace(/{{user_name}}/g, currentUser.name);
          break;
        case "plan_rendez_vous":
          newSubject = t.meetingRequestSubject;
          newMessage = t.meetingRequestMessage
            .replace(/{{lead_name}}/g, lead.full_name)
            .replace(/{{user_name}}/g, currentUser.name);
          break;
        case "follow_up":
          newSubject = t.followingUpSubject;
          newMessage = t.followingUpMessage
            .replace(/{{lead_name}}/g, lead.full_name)
            .replace(/{{user_name}}/g, currentUser.name);
          break;
        case "custom":
          // Custom template - leave empty or set defaults
          newSubject = "";
          newMessage = "";
          break;
        default:
          newSubject = "";
          newMessage = "";
      }
    } else {
      // LinkedIn messages
      switch (currentTopic) {
        case "ask_for_contact":
          newMessage = t.linkedinConnectionRequest
            .replace(/{{lead_name}}/g, lead.full_name)
            .replace(/{{company}}/g, lead.company);
          break;
        case "plan_rendez_vous":
          newMessage = t.linkedinMeetingRequest.replace(
            /{{lead_name}}/g,
            lead.full_name
          );
          break;
        case "follow_up":
          newMessage = t.linkedinFollowingUp.replace(
            /{{lead_name}}/g,
            lead.full_name
          );
          break;
        case "custom":
          newMessage = "";
          break;
        default:
          newMessage = "";
      }
    }

    return { subject: newSubject, message: newMessage };
  };

  // Regenerate template if message type or language changes
  useEffect(() => {
    if (isInitialRender.current || !topic || topic === "custom") {
      return;
    }

    const template = generateTemplate(topic);

    if (!isSubjectEdited) {
      setSubject(template.subject);
    }
    if (!isMessageEdited) {
      setMessage(template.message);
    }
  }, [messageType, language]);

  // Reset everything when composer opens
  useEffect(() => {
    if (isOpen && lead) {
      setIsSubjectEdited(false);
      setIsMessageEdited(false);
      setTopic("");
      setSubject("");
      setMessage("");
      setSendStatus("idle");
      setSendError(null);
      setSendResult(null);
      isInitialRender.current = true;
    }
  }, [isOpen, lead]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubject(e.target.value);
    setIsSubjectEdited(true);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setIsMessageEdited(true);
  };

  // Handle topic change with template generation
  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTopic = e.target.value;
    setTopic(newTopic);

    // Reset edit flags and generate new template
    setIsSubjectEdited(false);
    setIsMessageEdited(false);

    const template = generateTemplate(newTopic);

    setSubject(template.subject);
    setMessage(template.message);
  };

  // Template buttons for quick insertion
  const insertTemplate = (templateType: string) => {
    if (!lead || !currentUser) return;
    
    let newSubject = "";
    let newMessage = "";
    
    switch (templateType) {
      case "connection":
        newSubject = t.connectionRequestSubject;
        newMessage = t.connectionRequestMessage
          .replace(/{{lead_name}}/g, lead.full_name)
          .replace(/{{company}}/g, lead.company)
          .replace(/{{user_name}}/g, currentUser.name);
        break;
      case "meeting":
        newSubject = t.meetingRequestSubject;
        newMessage = t.meetingRequestMessage
          .replace(/{{lead_name}}/g, lead.full_name)
          .replace(/{{user_name}}/g, currentUser.name);
        break;
      case "followup":
        newSubject = t.followingUpSubject;
        newMessage = t.followingUpMessage
          .replace(/{{lead_name}}/g, lead.full_name)
          .replace(/{{user_name}}/g, currentUser.name);
        break;
    }
    
    setSubject(newSubject);
    setMessage(newMessage);
    setIsSubjectEdited(true);
    setIsMessageEdited(true);
  };

  if (!isOpen || !lead) {
    return null;
  }

  const handleSend = async () => {
    if (messageType === "email") {
      setIsSending(true);
      setSendStatus("idle");
      setSendError(null);
      setSendResult(null);
      
      try {
        // Check capability first
        const capability = await checkEmailCapability();
        setEmailCapability(capability);

        if (capability.can_send_emails) {
          // Validate required fields
          if (!subject.trim()) {
            throw new Error("Subject is required");
          }
          if (!message.trim()) {
            throw new Error("Message is required");
          }
          if (!lead.id) {
            throw new Error("Lead ID is required");
          }

          // Send email using the new endpoint
          const result = await sendEmailToLead(lead.id, {
            subject,
            body: message,
          });
          
          setSendResult(result.data);
          setSendStatus("success");
          toast.success("Email sent successfully!");

          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setSendStatus("error");
          setSendError(capability.message);
          toast.error(
            () => (
              <span>
                {capability.message}. Please{" "}
                <Link
                  to="/settings/integrations"
                  className="text-indigo-600 hover:underline"
                  onClick={() => toast.dismiss()}
                >
                  check your integration
                </Link>
                .
              </span>
            ),
            {
              duration: 5000,
            }
          );
        }
      } catch (error) {
        setSendStatus("error");
        const errorMessage =
          error instanceof Error ? error.message : "An unexpected error occurred.";
        setSendError(errorMessage);
        toast.error(errorMessage);
        console.error("Failed to send email:", error);
      } finally {
        setIsSending(false);
      }
    } else {
      // LinkedIn - open profile
      if (lead.profile_url) {
        window.open(lead.profile_url, "_blank");
      }
    }
  };

  const handleCopy = () => {
    if (messageType === "email") {
      navigator.clipboard.writeText(`Subject: ${subject}\n\n${message}`);
    } else {
      navigator.clipboard.writeText(message);
    }
  };

  const getCapabilityStatusColor = () => {
    if (!emailCapability) return "text-gray-500";
    return emailCapability.can_send_emails ? "text-green-600" : "text-red-600";
  };

  const getCapabilityStatusIcon = () => {
    if (!emailCapability) return null;
    
    if (emailCapability.can_send_emails) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
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
          {/* Lead Information */}
          <div className="flex items-center mb-6">
            <UserCircleIcon className="h-12 w-12 text-gray-400" />
            <div className="ml-4">
              <p className="font-semibold text-gray-800">{lead.full_name}</p>
              <p className="text-sm text-gray-500">{lead.email}</p>
              <p className="text-xs text-gray-400">Lead ID: {lead.id}</p>
            </div>
          </div>

          {/* Email Capability Status 
          {emailCapability && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getCapabilityStatusIcon()}
                  <span className={`ml-2 font-medium ${getCapabilityStatusColor()}`}>
                    Email Status: {emailCapability.can_send_emails ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Provider:</span>{" "}
                  <span className="font-medium">
                    {emailCapability.provider_email || "Not connected"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Token expires:</span>{" "}
                  <span className="font-medium">
                    {formatExpiryDate(emailCapability.expires_at)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm">
                <span className="text-gray-600">Status message:</span>{" "}
                <span className={emailCapability.can_send_emails ? "text-green-600" : "text-red-600"}>
                  {emailCapability.message}
                </span>
              </p>
            </div>
          )}*/}

          {/* Message Type and Language Selection */}
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
                  disabled={emailCapability?.can_send_emails === false}
                />
                <span className={`ml-2 ${emailCapability?.can_send_emails === false ? 'text-gray-400' : 'text-gray-700'}`}>
                  {t.email}
                </span>
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
              <div className="border-l border-gray-300 h-6 mx-4"></div>
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

          {/* Topic Selection */}
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
              onChange={handleTopicChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={messageType === "email" && emailCapability?.can_send_emails === false}
            >
              <option value="">{t.topicPlaceholder}</option>
              {t.topics.map((topicOption) => (
                <option key={topicOption.value} value={topicOption.value}>
                  {topicOption.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Template Buttons */}
          {topic && topic !== "custom" && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertTemplate("connection")}
                  className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
                >
                  Connection Request
                </button>
                <button
                  type="button"
                  onClick={() => insertTemplate("meeting")}
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                >
                  Meeting Request
                </button>
                <button
                  type="button"
                  onClick={() => insertTemplate("followup")}
                  className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
                >
                  Follow-up
                </button>
              </div>
            </div>
          )}

          {/* Message Composition */}
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
                    onChange={handleSubjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={emailCapability?.can_send_emails === false}
                    placeholder="Enter email subject"
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
                onChange={handleMessageChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={messageType === "email" && emailCapability?.can_send_emails === false}
                placeholder="Enter your message here..."
              />
              
              {/* Edit Status Indicator */}
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
                {isSubjectEdited && messageType === "email" && (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Subject edited
                  </span>
                )}
                {isMessageEdited && (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Message edited
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Send Result Display */}
          {sendStatus === "success" && sendResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-green-800">Email sent successfully!</span>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <p>Message ID: {sendResult.message_id}</p>
                <p>To: {sendResult.lead.email}</p>
              </div>
            </div>
          )}

          {sendStatus === "error" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium text-red-800">Error sending email</span>
              </div>
              <p className="mt-1 text-sm text-red-700">{sendError}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center sticky bottom-0 bg-white z-10">
          <div>
            {sendStatus === "success" && (
              <span className="text-green-600">Email sent! Closing in 3 seconds...</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSending}
            >
              {t.cancelButton}
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending || !topic || !message.trim()}
            >
              {t.copyButton}
            </button>
            <button
              onClick={handleSend}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isSending || 
                !topic || 
                !message.trim() || 
                (messageType === "email" && !subject.trim()) ||
                (messageType === "email" && emailCapability?.can_send_emails === false)
              }
            >
              {isSending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                t.sendButton
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPiliaComposer;