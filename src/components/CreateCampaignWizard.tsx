import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { leadService, Lead } from '../services/leadsService';
import { Dialog } from '@headlessui/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type CampaignFormValues = {
  name:string;
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

const CreateCampaignWizard: React.FC<CreateCampaignWizardProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, control, watch, getValues, setValue, trigger, formState: { errors } } = useForm<CampaignFormValues>();
  const schedule = watch('schedule');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && step === 2) {
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

  const onSubmit = (data: CampaignFormValues) => {
    console.log(data);
    // Handle form submission
    onClose();
  };

  const handleNext = async () => {
    let isValid = false;
    switch (step) {
      case 1:
        isValid = await trigger(['name', 'subject', 'sender']);
        break;
      case 2:
        // Add validation for audience step if needed
        isValid = true;
        break;
      case 3:
        isValid = await trigger('content');
        break;
      case 4:
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
            <h3 className="text-lg font-medium leading-6 text-gray-900">Campaign Info</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                This information will be used to identify your campaign.
              </p>
            </div>
            <div className="mt-4 space-y-4">
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
              <div>
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
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Audience</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Select the contacts or segments you want to send this campaign to.
              </p>
            </div>
            <div className="mt-4">
              {leadsLoading && <p>Loading leads...</p>}
              {leadsError && <p className="text-red-600">{leadsError}</p>}
              {!leadsLoading && !leadsError && (
                <fieldset>
                  <legend className="sr-only">Contacts</legend>
                  <div className="space-y-2">
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
      case 3:
        return (
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Email Content</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Compose the email content using the rich text editor below.
              </p>
            </div>
            <div className="mt-4">
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
      case 4:
        return (
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Schedule</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Choose when you want to send this campaign.
              </p>
            </div>
            <div className="mt-4 space-y-4">
              <fieldset>
                <legend className="sr-only">Scheduling Options</legend>
                <div className="space-y-2">
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
      case 5:
        const values = getValues();
        return (
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Review & Confirm</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Please review the campaign details before sending.
              </p>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Campaign Name</h4>
                <p className="mt-1 text-sm text-gray-900">{values.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Email Subject</h4>
                <p className="mt-1 text-sm text-gray-900">{values.subject}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Sender Email</h4>
                <p className="mt-1 text-sm text-gray-900">{values.sender}</p>
              </div>
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
        <Dialog.Panel className="w-full max-w-lg rounded bg-white p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Back
              </button>
              {step < 5 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Next
                </button>
              )}
              {step === 5 && (
                <button
                  type="submit"
                  className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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