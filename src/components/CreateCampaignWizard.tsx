import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { leadService, Lead } from '../services/leadsService';
import emailService, { EmailCapability } from '../services/emailService';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Link } from 'react-router-dom';

type CampaignFormValues = {
  name: string;
  subject: string;
  sender: string;
  content: string;
  audience: string[];
  schedule: 'now' | 'later';
  scheduleTime?: string;
};

interface CreateCampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProgressBar = ({ currentStep, totalSteps }) => {
    const percentage = (currentStep / totalSteps) * 100;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    );
  };
  

const CreateCampaignWizard: React.FC<CreateCampaignWizardProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, control, watch, getValues, setValue, trigger, formState: { errors } } = useForm<CampaignFormValues>();
  const schedule = watch('schedule');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [emailCapability, setEmailCapability] = useState<EmailCapability | null>(null);
  const [emailCapabilityLoading, setEmailCapabilityLoading] = useState(true);
  const [emailCapabilityError, setEmailCapabilityError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const checkEmailCapability = async () => {
        try {
          setEmailCapabilityLoading(true);
          const response = await emailService.checkEmailCapability();
          if (response.success) {
            setEmailCapability(response.data!);
          } else {
            setEmailCapabilityError(response.message || 'Failed to check email capability.');
          }
        } catch (error) {
          setEmailCapabilityError('An unexpected error occurred.');
        } finally {
          setEmailCapabilityLoading(false);
        }
      };
      checkEmailCapability();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === 3) {
      const fetchLeads = async () => {
        setLeadsLoading(true);
        setLeadsError(null);
        try {
          const fetchedLeads = await leadService.getLeads();
          setLeads(fetchedLeads);
        } catch (error) {
          setLeadsError('Failed to fetch leads. Please try again.');
        } finally {
          setLeadsLoading(false);
        }
      };
      fetchLeads();
    }
  }, [isOpen, step]);

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      const payload = {
        lead_ids: data.audience.map(Number),
        subject: data.subject,
        body: data.content,
        personalize: true, // Or get this from form
      };
      await emailService.sendBulkEmails(payload);
      toast.success('Campaign created and emails sent successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      toast.error('Failed to send campaign emails. Please try again.');
      // Handle and display error to the user
    }
  };

  const handleNext = async () => {
    let isValid = false;
    switch (step) {
      case 1:
        isValid = emailCapability?.can_send_emails || false;
        break;
      case 2:
        isValid = await trigger(['name', 'subject', 'sender']);
        break;
      case 3:
        isValid = true;
        break;
      case 4:
        isValid = await trigger('content');
        break;
      case 5:
        isValid = await trigger('schedule');
        if (getValues('schedule') === 'later') {
          isValid = await trigger('scheduleTime');
        }
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h3 className="text-xl font-semibold leading-6 text-gray-900">Email Capability Check</h3>
            <p className="mt-1 text-sm text-gray-500">
              Checking if you can send emails through your integrated account.
            </p>
            <div className="mt-6">
              {emailCapabilityLoading && (
                <div className="flex items-center space-x-2">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6"></div>
                  <p>Checking email capabilities...</p>
                </div>
              )}
              {emailCapabilityError && (
                <div className="flex items-center space-x-2 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p>{emailCapabilityError}</p>
                </div>
              )}
              {emailCapability && (
                <div className={`p-4 rounded-md ${emailCapability.can_send_emails ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {emailCapability.can_send_emails ? (
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${emailCapability.can_send_emails ? 'text-green-800' : 'text-red-800'}`}>
                        {emailCapability.can_send_emails ? 'Ready to send emails' : 'Cannot send emails'}
                      </h3>
                      <div className={`mt-2 text-sm ${emailCapability.can_send_emails ? 'text-green-700' : 'text-red-700'}`}>
                        <p>{emailCapability.message}</p>
                      </div>
                      {!emailCapability.can_send_emails && (
                        <div className="mt-4">
                          <Link to="/integrations" className="text-sm font-medium text-blue-600 hover:underline">
                            Go to Integrations
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-xl font-semibold leading-6 text-gray-900">Campaign Info</h3>
            <p className="mt-1 text-sm text-gray-500">
              This information will be used to identify your campaign.
            </p>
            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Campaign Name
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'Campaign name is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Email Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  {...register('subject', { required: 'Email subject is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.subject && <p className="mt-2 text-sm text-red-600">{errors.subject.message}</p>}
              </div>
            {/* <div>
               <label htmlFor="sender" className="block text-sm font-medium text-gray-700">
                  Sender Email
                </label>
                <input
                  type="email"
                  id="sender"
                  {...register('sender', { required: 'Sender email is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.sender && <p className="mt-2 text-sm text-red-600">{errors.sender.message}</p>}
              </div> */}  
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="text-xl font-semibold leading-6 text-gray-900">Audience</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select the contacts or segments you want to send this campaign to.
            </p>
            <div className="mt-6">
              {leadsLoading && <p>Loading leads...</p>}
              {leadsError && <p className="text-red-600">{leadsError}</p>}
              {!leadsLoading && !leadsError && (
                <fieldset>
                  <legend className="sr-only">Contacts</legend>
                  <div className="max-h-60 overflow-y-auto space-y-4">
                    {leads.map((lead) => (
                      <div key={lead.id} className="flex items-center">
                        <input
                          id={`lead-${lead.id}`}
                          type="checkbox"
                          value={lead.id}
                          {...register('audience')}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`lead-${lead.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                          {lead.full_name} ({lead.email})
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h3 className="text-xl font-semibold leading-6 text-gray-900">Email Content</h3>
            <p className="mt-1 text-sm text-gray-500">
              Compose the email content using the rich text editor below.
            </p>
            <div className="mt-6">
              <div className="flex space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => setValue('content', getValues('content') + '{{first_name}}')}
                  className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                >
                  {'{{first_name}}'}
                </button>
                <button
                  type="button"
                  onClick={() => setValue('content', getValues('content') + '{{company}}')}
                  className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                >
                  {'{{company}}'}
                </button>
              </div>
              <Controller
                name="content"
                control={control}
                rules={{ required: 'Email content is required' }}
                render={({ field }) => <ReactQuill theme="snow" {...field} />}
              />
              {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>}
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h3 className="text-xl font-semibold leading-6 text-gray-900">Schedule</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose when you want to send this campaign.
            </p>
            <div className="mt-6 space-y-6">
              <fieldset>
                <legend className="sr-only">Scheduling Options</legend>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="schedule-now"
                      type="radio"
                      value="now"
                      {...register('schedule')}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="schedule-now" className="ml-3 block text-sm font-medium text-gray-700">
                      Send now
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="schedule-later"
                      type="radio"
                      value="later"
                      {...register('schedule')}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="schedule-later" className="ml-3 block text-sm font-medium text-gray-700">
                      Schedule for later
                    </label>
                  </div>
                </div>
              </fieldset>
              {schedule === 'later' && (
                <div>
                  <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700">
                    Schedule Time
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduleTime"
                    {...register('scheduleTime', { required: 'Schedule time is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.scheduleTime && <p className="mt-2 text-sm text-red-600">{errors.scheduleTime.message}</p>}
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        const values = getValues();
        return (
          <div>
            <h3 className="text-xl font-semibold leading-6 text-gray-900">Review & Confirm</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please review the campaign details before sending.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Campaign Name</h4>
                <p className="mt-1 text-sm text-gray-900">{values.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Email Subject</h4>
                <p className="mt-1 text-sm text-gray-900">{values.subject}</p>
              </div>
       {/*       <div>
                <h4 className="text-sm font-medium text-gray-500">Sender Email</h4>
                <p className="mt-1 text-sm text-gray-900">{values.sender}</p>
              </div>
        */}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Schedule</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {values.schedule === 'now' ? 'Send now' : `Scheduled for ${new Date(values.scheduleTime).toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
        <ProgressBar currentStep={step} totalSteps={6} />
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Back
              </button>
              {step < 6 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Next
                </button>
              )}
              {step === 6 && (
                <button
                  type="submit"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Confirm & Send
                </button>
              )}
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CreateCampaignWizard;  