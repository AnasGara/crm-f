import React, { useState, useEffect } from "react";
import leadService, { Lead, CreateLeadData, UpdateLeadData } from "../services/leadsService";
import LeadForm from "./LeadForm";
import GDPiliaComposer from "./GDPiliaComposer";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  ChevronUpDownIcon,
  PlusIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import StatusIcon from "./StatusIcon";
import taskService, { Task } from "../services/taskService";
import organizationService from "../services/organizationService";

type Status = "to_be_treated" | "qualified" | "archived";

const Leads: React.FC<{ searchTerm?: string }> = ({ searchTerm }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    type: "Other",
    priority: "Medium",
    status: "Open",
    due_date: "",
    related_to: "",
  });
  const [selectedLeadForTask, setSelectedLeadForTask] = useState<Lead | null>(
    null
  );
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [organizationUsers, setOrganizationUsers] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filterLocation, setFilterLocation] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [filterName, setFilterName] = useState("");
  
  const [sortConfig, setSortConfig] = useState<{
    key: "full_name" | "created_at" | "location" | "company" | "position";
    direction: "asc" | "desc";
  }>({
    key: "created_at",
    direction: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch ALL leads from API once on initial load
  useEffect(() => {
    const fetchOrganizationUsers = async () => {
      try {
        const users = await organizationService.getOrganizationUsers();
        setOrganizationUsers(users);
      } catch (error) {
        console.error("Failed to fetch organization users:", error);
      }
    };
    fetchOrganizationUsers();
    const fetchLeads = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch all leads with an empty filter
        const response = await leadService.filterLeads({});
        if (response && response.data) {
          setAllLeads(response.data);
          setLeads(response.data);
        } else {
          throw new Error("No data received from server");
        }
      } catch (err: any) {
        console.error("Error fetching leads:", err);
        setError(`Failed to fetch leads: ${err.message || "Please check your connection"}`);
        // Set empty arrays to avoid further errors
        setAllLeads([]);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeads();
  }, []); // Empty dependency array - fetch once on mount

  // Also fetch when searchTerm changes if it's a parent-controlled search
  useEffect(() => {
    if (searchTerm && searchTerm.trim() !== "") {
      // If there's a search term from parent, we might want to apply it
      // but since we're doing frontend filtering, we can handle it in the filter effect
      console.log("Search term changed:", searchTerm);
    }
  }, [searchTerm]);

  // Apply frontend filtering whenever filters or searchTerm change
  useEffect(() => {
    if (allLeads.length === 0) {
      setLeads([]);
      return;
    }

    let filtered = [...allLeads];
    
    // Apply search term filter (if provided from parent)
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        (lead.full_name && lead.full_name.toLowerCase().includes(searchLower)) ||
        (lead.company && lead.company.toLowerCase().includes(searchLower)) ||
        (lead.position && lead.position.toLowerCase().includes(searchLower)) ||
        (lead.location && lead.location.toLowerCase().includes(searchLower)) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply individual column filters
    if (filterName) {
      filtered = filtered.filter(lead =>
        lead.full_name && lead.full_name.toLowerCase().includes(filterName.toLowerCase())
      );
    }
    
    if (filterCompany) {
      filtered = filtered.filter(lead =>
        lead.company && lead.company.toLowerCase().includes(filterCompany.toLowerCase())
      );
    }
    
    if (filterPosition) {
      filtered = filtered.filter(lead =>
        lead.position && lead.position.toLowerCase().includes(filterPosition.toLowerCase())
      );
    }
    
    if (filterLocation) {
      filtered = filtered.filter(lead =>
        lead.location && lead.location.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }
    
    if (filterStatus) {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle undefined/null values
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      if (sortConfig.key === "created_at") {
        try {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();
          return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
        } catch {
          return 0;
        }
      } else {
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }
    });
    
    setLeads(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allLeads, searchTerm, filterName, filterLocation, filterCompany, filterPosition, filterStatus, sortConfig]);

  // Helper function to format status display
  const formatStatusDisplay = (status: Status | "") => {
    if (!status) return "All";
    
    switch (status) {
      case "to_be_treated":
        return "Non treated";
      case "qualified":
        return "Qualified";
      case "archived":
        return "Archived";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
    }
  };

  // Helper function to get status text for display
  const getStatusText = (status: Status) => {
    switch (status) {
      case "to_be_treated":
        return "Non treated";
      case "qualified":
        return "Qualified";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = leads.slice(startIndex, endIndex);

  const handleSaveLead = async (leadData: CreateLeadData | UpdateLeadData) => {
    try {
      setError(null);
      let updatedOrNewLead: Lead;
      
      if (editingLead) {
        updatedOrNewLead = await leadService.updateLead(editingLead.id, leadData as UpdateLeadData);
        // Update in allLeads
        const updatedAllLeads = allLeads.map((l) => 
          l.id === editingLead.id ? updatedOrNewLead : l
        );
        setAllLeads(updatedAllLeads);
      } else {
        updatedOrNewLead = await leadService.createLead(leadData as CreateLeadData);
        // Add to allLeads at the beginning
        setAllLeads([updatedOrNewLead, ...allLeads]);
      }
      
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (error: any) {
      console.error('Save lead error:', error);
      setError(`Failed to save lead: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      setError(null);
      await leadService.deleteLead(id);
      // Remove from allLeads
      const newAllLeads = allLeads.filter((lead) => lead.id !== id);
      setAllLeads(newAllLeads);
      
      if (currentLeads.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error: any) {
      console.error('Delete lead error:', error);
      setError(`Failed to delete lead: ${error.message || 'Unknown error'}`);
    }
  };

  const handleToggleTreated = async (lead: Lead) => {
    try {
      setError(null);
      const updatedLead = await (lead.treated
        ? leadService.markAsUntreated(lead.id)
        : leadService.markAsTreated(lead.id));
      // Update in allLeads
      setAllLeads(allLeads.map((l) => (l.id === lead.id ? updatedLead : l)));
    } catch (error: any) {
      console.error('Toggle treated error:', error);
      setError(`Failed to update lead status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleOpenAddTaskModal = (lead: Lead) => {
    setSelectedLeadForTask(lead);
    setTaskFormData({
      ...taskFormData,
      title: `[Action] ${lead.full_name}`,
      related_to: lead.email,
    });
    setShowAddTaskModal(true);
  };

  const handleAddTask = async () => {
    if (!selectedLeadForTask) return;

    try {
      await taskService.createTask({
        ...taskFormData,
        related_to: selectedLeadForTask.email,
        assignee_id: undefined,
      });
      setShowAddTaskModal(false);
      // Optionally, you can add a success notification here
    } catch (error) {
      console.error("Failed to add task:", error);
      // Optionally, you can add an error notification here
    }
  };

  const handleSetTreated = async (lead: Lead) => {
    try {
      setError(null);
      const updatedLead = await leadService.markAsTreated(lead.id);
      // Update in allLeads
      setAllLeads(allLeads.map((l) => (l.id === lead.id ? updatedLead : l)));
    } catch (error: any) {
      console.error('Set treated error:', error);
      setError(`Failed to mark lead as treated: ${error.message || 'Unknown error'}`);
    }
  };

  // New function to handle profile click
  const handleProfileClick = async (lead: Lead) => {
    // Open profile in new tab immediately
    if (lead.profile_url) {
      window.open(lead.profile_url, "_blank");
    }
    
    // If lead is not treated yet, mark it as viewed (treated = true without changing status)
    if (!lead.treated) {
      try {
        setError(null);
        // Directly update the lead's treated status to true
        const updatedLead = await leadService.updateLead(lead.id, { treated: true });
        // Update in allLeads
        setAllLeads(allLeads.map((l) => (l.id === lead.id ? updatedLead : l)));
      } catch (error) {
        console.error("Failed to mark lead as viewed:", error);
        // Optional: show error notification
        setError("Failed to update lead status");
      }
    }
  };

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  const resetFilters = () => {
    setFilterName("");
    setFilterLocation("");
    setFilterCompany("");
    setFilterPosition("");
    setFilterStatus("");
    // currentPage will be reset to 1 by the useEffect
  };

  const handleColumnClick = (column: "full_name" | "location" | "company" | "position" | "created_at") => {
    // If clicking the same column, toggle direction
    if (sortConfig.key === column) {
      setSortConfig({
        key: column,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // If clicking a different column, set it as sort key with default asc
      setSortConfig({
        key: column,
        direction: "asc",
      });
    }
  };

  const handleFilterInput = (column: "full_name" | "location" | "company" | "position", value: string) => {
    switch (column) {
      case "full_name":
        setFilterName(value);
        break;
      case "location":
        setFilterLocation(value);
        break;
      case "company":
        setFilterCompany(value);
        break;
      case "position":
        setFilterPosition(value);
        break;
    }
    // currentPage will be reset to 1 by the useEffect
  };

  const clearColumnFilter = (column: "full_name" | "location" | "company" | "position") => {
    switch (column) {
      case "full_name":
        setFilterName("");
        break;
      case "location":
        setFilterLocation("");
        break;
      case "company":
        setFilterCompany("");
        break;
      case "position":
        setFilterPosition("");
        break;
    }
  };

  // Handle retry fetch
  const handleRetryFetch = () => {
    setError(null);
    setLoading(true);
    // Re-fetch leads
    setTimeout(() => {
      const fetchLeads = async () => {
        try {
          const response = await leadService.filterLeads({});
          if (response && response.data) {
            setAllLeads(response.data);
            setLeads(response.data);
          } else {
            throw new Error("No data received");
          }
        } catch (err: any) {
          setError(`Failed to fetch leads: ${err.message || "Please check your connection"}`);
        } finally {
          setLoading(false);
        }
      };
      fetchLeads();
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all leads including their details</p>
          {allLeads.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              • Showing {leads.length} of {allLeads.length} leads 
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              showFilters ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {(filterName || filterLocation || filterCompany || filterPosition || filterStatus) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Active</span>
            )}
          </button>
          <button
            onClick={() => {
              setEditingLead(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Lead
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
            <button
              onClick={handleRetryFetch}
              className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="name-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={filterName}
                  onChange={(e) => handleFilterInput("full_name", e.target.value)}
                  placeholder="Filter by name"
                />
                {filterName && (
                  <button
                    onClick={() => clearColumnFilter("full_name")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="company-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={filterCompany}
                  onChange={(e) => handleFilterInput("company", e.target.value)}
                  placeholder="Filter by company"
                />
                {filterCompany && (
                  <button
                    onClick={() => clearColumnFilter("company")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="location-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={filterLocation}
                  onChange={(e) => handleFilterInput("location", e.target.value)}
                  placeholder="Filter by location"
                />
                {filterLocation && (
                  <button
                    onClick={() => clearColumnFilter("location")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="position-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="position-filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={filterPosition}
                  onChange={(e) => handleFilterInput("position", e.target.value)}
                  placeholder="Filter by position"
                />
                {filterPosition && (
                  <button
                    onClick={() => clearColumnFilter("position")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {(["", "to_be_treated", "qualified", "archived"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  filterStatus === status
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {formatStatusDisplay(status)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Modals */}
      <LeadForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveLead} lead={editingLead} />
      <GDPiliaComposer isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} lead={editingLead} />

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={taskFormData.type}
                  onChange={(e) => setTaskFormData({ ...taskFormData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Report">Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={taskFormData.priority}
                  onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as Task['priority'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={taskFormData.status}
                  onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value as Task['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={taskFormData.due_date}
                  onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Related To</label>
                <div className="relative">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={taskFormData.related_to}
                        onChange={(e) => {
                          setTaskFormData({ ...taskFormData, related_to: e.target.value });
                          setIsManualEntry(true);
                          if (e.target.value.trim()) {
                            setShowUserDropdown(false);
                          }
                        }}
                        onFocus={() => {
                          if (!isManualEntry) {
                            setShowUserDropdown(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setShowUserDropdown(false);
                            setIsManualEntry(false);
                          }
                        }}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Select user or enter email"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(!showUserDropdown);
                          setIsManualEntry(false);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDownIcon size={20} />
                      </button>
                    </div>
                    {taskFormData.related_to && (
                      <button
                        type="button"
                        onClick={() => {
                          setTaskFormData({ ...taskFormData, related_to: '' });
                          setIsManualEntry(false);
                        }}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {showUserDropdown && organizationUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {organizationUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setTaskFormData({ ...taskFormData, related_to: user.email });
                            setShowUserDropdown(false);
                            setIsManualEntry(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select a user from your organization or enter an email manually</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTaskModal(false);
                  setShowUserDropdown(false);
                  setIsManualEntry(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!taskFormData.title || !taskFormData.due_date}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleColumnClick("full_name")}
                >
                  <div className="flex items-center justify-between">
                    <span>Name</span>
                    <div className="flex items-center">
                      {filterName && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mr-1">
                          Filtered
                        </span>
                      )}
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      {sortConfig.key === "full_name" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1 text-gray-500" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <input
                      type="text"
                      className="block w-full text-xs rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={filterName}
                      onChange={(e) => handleFilterInput("full_name", e.target.value)}
                      placeholder="Type to filter..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                <th
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleColumnClick("company")}
                >
                  <div className="flex items-center justify-between">
                    <span>Company</span>
                    <div className="flex items-center">
                      {filterCompany && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mr-1">
                          Filtered
                        </span>
                      )}
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      {sortConfig.key === "company" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1 text-gray-500" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <input
                      type="text"
                      className="block w-full text-xs rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={filterCompany}
                      onChange={(e) => handleFilterInput("company", e.target.value)}
                      placeholder="Type to filter..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </th>
                <th
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleColumnClick("position")}
                >
                  <div className="flex items-center justify-between">
                    <span>Position</span>
                    <div className="flex items-center">
                      {filterPosition && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mr-1">
                          Filtered
                        </span>
                      )}
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      {sortConfig.key === "position" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1 text-gray-500" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <input
                      type="text"
                      className="block w-full text-xs rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={filterPosition}
                      onChange={(e) => handleFilterInput("position", e.target.value)}
                      placeholder="Type to filter..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </th>
                <th
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleColumnClick("location")}
                >
                  <div className="flex items-center justify-between">
                    <span>Location</span>
                    <div className="flex items-center">
                      {filterLocation && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mr-1">
                          Filtered
                        </span>
                      )}
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      {sortConfig.key === "location" && (
                        sortConfig.direction === "asc" ? 
                        <ArrowUpIcon className="h-3 w-3 ml-1 text-gray-500" /> : 
                        <ArrowDownIcon className="h-3 w-3 ml-1 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <input
                      type="text"
                      className="block w-full text-xs rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      value={filterLocation}
                      onChange={(e) => handleFilterInput("location", e.target.value)}
                      placeholder="Type to filter..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Profile</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    {allLeads.length === 0 ? "No leads found. Please check your connection or add a new lead." : "No leads match your filters"}
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-blue-600">
                            {lead.full_name ? lead.full_name.charAt(0).toUpperCase() : "?"}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900 flex items-center">
                            {lead.full_name || "Unnamed Lead"}
                            {!lead.treated && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                New
                              </span>
                            )}
                          </p>
                          {lead.created_at && (
                            <p className="text-xs text-gray-500">
                              Added {new Date(lead.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center">
                        <StatusIcon status={lead.status} />
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(lead.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 font-medium">
                      {lead.email || "No email"}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 font-medium">
                      {lead.company || "-"}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {lead.position || "-"}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {lead.location || "-"}
                    </td>
                    <td className="px-3 py-4">
                      <button
                        onClick={() => handleProfileClick(lead)}
                        disabled={!lead.profile_url}
                        className={`inline-flex items-center justify-center p-2 rounded-full cursor-pointer active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          lead.profile_url
                            ? "text-blue-600 bg-blue-50 hover:text-blue-700 hover:bg-blue-100 focus:ring-blue-500"
                            : "text-gray-400 bg-gray-50 cursor-not-allowed"
                        }`}
                        title={lead.profile_url ? "View profile" : "No profile URL"}
                      >
                        <UserIcon className="h-5 w-5" />
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleTreated(lead)}
                          className={`p-1 ${
                            lead.treated
                              ? "text-yellow-500 hover:text-yellow-700"
                              : "text-green-500 hover:text-green-700"
                          }`}
                          title={lead.treated ? "Mark as unviewed" : "Mark as viewed"}
                        >
                          {lead.treated ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button 
                          onClick={() => { setEditingLead(lead); setIsModalOpen(true); }} 
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Edit lead"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id)} 
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Delete lead"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => { setEditingLead(lead); setIsComposerOpen(true); }} 
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Compose email"
                        >
                          <EnvelopeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenAddTaskModal(lead)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Add task"
                        >
                          <PlusIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, leads.length)}</span> of <span className="font-medium">{leads.length}</span> results
                {allLeads.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    (from {allLeads.length} total leads)
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 border rounded text-sm font-medium ${
                        currentPage === pageNum
                          ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                          : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;