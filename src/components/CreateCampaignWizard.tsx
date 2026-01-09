import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { leadService, Lead } from '../services/leadsService';
import emailService, { EmailCapability, ScheduleBulkEmailPayload } from '../services/emailService';
import { timezoneUtils } from '../utils/timeZoneUtils';
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
  onClose: (campaignSent?: boolean) => void;
}

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const percentage = (currentStep / totalSteps) * 100;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

const CreateCampaignWizard: React.FC<CreateCampaignWizardProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [emailCapability, setEmailCapability] = useState<EmailCapability | null>(null);
  const [emailCapabilityLoading, setEmailCapabilityLoading] = useState(true);
  const [emailCapabilityError, setEmailCapabilityError] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>('');

  const { 
    register, 
    handleSubmit, 
    control, 
    watch, 
    getValues, 
    setValue, 
    trigger, 
    reset,
    setError,
    clearErrors,
    formState: { errors } 
  } = useForm<CampaignFormValues>({
    defaultValues: {
      name: '',
      subject: '',
      sender: '',
      content: '',
      audience: [],
      schedule: 'now',
      scheduleTime: timezoneUtils.getMinDateTime()
    }
  });

  const schedule = watch('schedule');

  // Get user timezone on component mount
  useEffect(() => {
    setUserTimezone(timezoneUtils.getUserTimezone());
  }, []);

  // Reset form when wizard is closed
  useEffect(() => {
    if (!isOpen) {
      reset({
        name: '',
        subject: '',
        sender: '',
        content: '',
        audience: [],
        schedule: 'now',
        scheduleTime: timezoneUtils.getMinDateTime()
      });
      setStep(1);
      setSending(false);
      setLeads([]);
      setLeadsError(null);
      setEmailCapability(null);
      setEmailCapabilityLoading(true);
      setEmailCapabilityError(null);
    }
  }, [isOpen, reset]);

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

  // Validation function for schedule time
  const validateScheduleTime = (value: string | undefined): string | true => {
    if (!value) return 'Schedule time is required';
    
    if (!timezoneUtils.isFutureDateTime(value)) {
      return 'Please select a date and time in the future';
    }
    
    return true;
  };

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      setSending(true);
      clearErrors(); // Clear any existing errors

      if (data.schedule === 'later') {
        // Convert local datetime to UTC for backend
        const utcDateTime = timezoneUtils.localToUTC(data.scheduleTime!);
        
        if (!utcDateTime) {
          toast.error('Invalid date/time selected');
          setSending(false);
          return;
        }

        const payload: ScheduleBulkEmailPayload = {
          lead_ids: data.audience.map(Number),
          subject: data.subject,
          body: data.content,
          send_at: utcDateTime, // Send UTC time to backend
          create_campaign: true,
          campaign_name: data.name,
          personalize: true,
        };

        const response = await emailService.scheduleBulkEmails(payload);
        
        if (response.success) {
          toast.success('Campaign scheduled successfully!');
          onClose(true);
        } else {
          // Handle backend validation errors
          if (response.errors) {
            Object.entries(response.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                // Handle nested fields like "lead_ids.1"
                if (field.includes('lead_ids.')) {
                  const index = field.split('.')[1];
                  const errorMessage = `Lead at position ${index}: ${messages[0]}`;
                  toast.error(errorMessage);
                } else {
                  // Map backend field names to form field names
                  let formField = field;
                  if (field === 'send_at') formField = 'scheduleTime';
                  
                  setError(formField as any, {
                    type: 'manual',
                    message: messages[0]
                  });
                  
                  // Show the first error in toast
                  if (field === Object.keys(response.errors!)[0]) {
                    toast.error(messages[0]);
                  }
                }
              }
            });
          } else {
            toast.error(response.message || 'Failed to schedule campaign.');
          }
        }
      } else {
        const payload = {
          lead_ids: data.audience.map(Number),
          subject: data.subject,
          body: data.content,
          personalize: true,
        };

        const response = await emailService.sendBulkEmails(payload);
        
        if (response.success) {
          toast.success('Campaign created and emails sent successfully!');
          onClose(true);
        } else {
          // Handle errors for immediate sending
          if (response.errors) {
            Object.entries(response.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                toast.error(messages[0]);
              }
            });
          } else {
            toast.error(response.message || 'Failed to send campaign.');
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to process campaign:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleNext = async () => {
    let isValid = false;
    switch (step) {
      case 1:
        isValid = emailCapability?.can_send_emails || false;
        if (!isValid) {
          toast.error('Please configure your email integration first.');
        }
        break;
      case 2:
        isValid = await trigger(['name', 'subject', 'sender']);
        break;
      case 3:
        isValid = getValues('audience').length > 0;
        if (!isValid) {
          toast.error('Please select at least one contact.');
        }
        break;
      case 4:
        isValid = await trigger('content');
        break;
      case 5:
        isValid = await trigger('schedule');
        if (getValues('schedule') === 'later') {
          isValid = await trigger('scheduleTime');
          
          // Additional client-side validation for schedule time
          if (isValid) {
            const scheduleTime = getValues('scheduleTime');
            const validationResult = validateScheduleTime(scheduleTime);
            
            if (validationResult !== true) {
              setError('scheduleTime', {
                type: 'manual',
                message: validationResult as string
              });
              toast.error(validationResult as string);
              isValid = false;
            } else {
              clearErrors('scheduleTime');
            }
          }
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
              {leadsLoading && (
                <div className="flex items-center space-x-2">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6"></div>
                  <p>Loading leads...</p>
                </div>
              )}
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
                  {leads.length === 0 && (
                    <p className="text-gray-500 text-sm">No leads available. Please add leads first.</p>
                  )}
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
                  onClick={() => setValue('content', (getValues('content') || '') + '{{first_name}}')}
                  className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                >
                  {'{{first_name}}'}
                </button>
                <button
                  type="button"
                  onClick={() => setValue('content', (getValues('content') || '') + '{{company}}')}
                  className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                >
                  {'{{company}}'}
                </button>
              </div>
              <Controller
                name="content"
                control={control}
                rules={{ required: 'Email content is required' }}
                render={({ field }) => <ReactQuill theme="snow" {...field} value={field.value || ''} />}
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
              Choose when you want to send this campaign. Times are shown in your local timezone.
            </p>
            <div className="mt-6 space-y-6">
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Your timezone:</span> {userTimezone}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  The email will be scheduled based on your local time and automatically converted to UTC.
                </p>
              </div>
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
                    Schedule Date & Time (Your Local Time)
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduleTime"
                    min={timezoneUtils.getMinDateTime()}
                    {...register('scheduleTime', { 
                      required: 'Schedule time is required',
                      validate: validateScheduleTime
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.scheduleTime && (
                    <p className="mt-2 text-sm text-red-600">{errors.scheduleTime.message}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Minimum: {timezoneUtils.formatForDisplay(timezoneUtils.getMinDateTime(), false)}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        const values = getValues();
        const utcScheduleTime = values.scheduleTime ? timezoneUtils.localToUTC(values.scheduleTime) : '';
        
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
              <div>
                <h4 className="text-sm font-medium text-gray-500">Contacts Selected</h4>
                <p className="mt-1 text-sm text-gray-900">{values.audience.length} contact{values.audience.length !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Schedule</h4>
                <div className="mt-1">
                  <p className="text-sm text-gray-900">
                    {values.schedule === 'now' 
                      ? 'Send now' 
                      : `Scheduled for ${timezoneUtils.formatForDisplay(values.scheduleTime!)}`
                    }
                  </p>
                  {values.schedule === 'later' && (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">UTC Time:</span> {utcScheduleTime}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Local Time:</span> {timezoneUtils.formatForDisplay(values.scheduleTime!, false)}
                      </p>
                    </div>
                  )}
                </div>
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
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={sending}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {schedule === 'later' ? 'Scheduling...' : 'Sending...'}
                    </span>
                  ) : (
                    schedule === 'later' ? 'Confirm & Schedule' : 'Confirm & Send'
                  )}
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