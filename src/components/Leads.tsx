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
} from "@heroicons/react/24/outline";
import StatusIcon from "./StatusIcon";

type Status = "to_be_treated" | "qualified" | "archived";

const Leads: React.FC<{ searchTerm?: string }> = ({ searchTerm }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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

  // Fetch leads from API with filters
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const filters: any = {
          full_name: searchTerm || filterName,
          location: filterLocation,
          company: filterCompany,
          position: filterPosition,
          status: filterStatus,
        };
        const response = await leadService.filterLeads(filters);
        setLeads(response.data);
      } catch {
        setError("Failed to fetch leads");
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [searchTerm, filterName, filterLocation, filterCompany, filterPosition, filterStatus]);

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

  // Compute filtered & sorted leads
  const filteredLeads = [...leads].filter((lead) => {
    return (
      (filterStatus ? lead.status === filterStatus : true) &&
      (filterName ? lead.full_name.toLowerCase().includes(filterName.toLowerCase()) : true) &&
      (filterCompany ? lead.company.toLowerCase().includes(filterCompany.toLowerCase()) : true) &&
      (filterPosition ? lead.position.toLowerCase().includes(filterPosition.toLowerCase()) : true) &&
      (filterLocation ? lead.location.toLowerCase().includes(filterLocation.toLowerCase()) : true)
    );
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (sortConfig.key === "created_at") {
      return sortConfig.direction === "asc"
        ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
        : new Date(bValue as string).getTime() - new Date(aValue as string).getTime();
    } else {
      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    }
  });

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = sortedLeads.slice(startIndex, endIndex);

  const handleSaveLead = async (leadData: CreateLeadData | UpdateLeadData) => {
    try {
      if (editingLead) {
        const updatedLead = await leadService.updateLead(editingLead.id, leadData as UpdateLeadData);
        setLeads(leads.map((l) => (l.id === editingLead.id ? updatedLead : l)));
      } else {
        const newLead = await leadService.createLead(leadData as CreateLeadData);
        setLeads([newLead, ...leads]);
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
      await leadService.deleteLead(id);
      setLeads(leads.filter((lead) => lead.id !== id));
      if (currentLeads.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
    } catch {
      setError("Failed to delete lead");
    }
  };

  const handleStatusChange = async (id: number, status: Status) => {
    try {
      const updatedLead = await leadService.updateLead(id, { status });
      setLeads(leads.map((lead) => (lead.id === id ? updatedLead : lead)));
    } catch (err) {
      console.error("Failed to update lead status:", err);
    }
  };

  const handleToggleTreated = async (lead: Lead) => {
    try {
      const updatedLead = await (lead.treated
        ? leadService.markAsUntreated(lead.id)
        : leadService.markAsTreated(lead.id));
      setLeads(leads.map((l) => (l.id === lead.id ? updatedLead : l)));
    } catch (error) {
      setError("Failed to update lead treated status");
    }
  };

  // New function to handle profile click
  const handleProfileClick = async (lead: Lead) => {
    handleToggleTreated(lead)
    try {
      // Open profile in new tab immediately
      window.open(lead.profile_url, "_blank");

      // If lead is not treated yet, mark it as viewed (treated = true without changing status)
      if (!lead.treated) {
        // Directly update the lead's treated status to true
        const updatedLead = await leadService.updateLead(lead.id, { treated: true });
        setLeads(leads.map((l) => (l.id === lead.id ? updatedLead : l)));
      }
    } catch (error) {
      console.error("Failed to mark lead as viewed:", error);
      // Optional: show error notification
      setError("Failed to update lead status");
    }
  };

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const resetFilters = () => {
    setFilterName("");
    setFilterLocation("");
    setFilterCompany("");
    setFilterPosition("");
    setFilterStatus("");
    setCurrentPage(1);
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
    
    // Set the corresponding filter input based on column
    if (column === "full_name") {
      // For name, just show sort indicator, or prompt for filter input
      // You could also add a direct filter input for name
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
    setCurrentPage(1);
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

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all leads including their details</p>
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
                    No leads found
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-blue-600">{lead.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900 flex items-center">
                            {lead.full_name}
                            {!lead.treated && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                New
                              </span>
                            )}
                          </p>
                          {lead.created_at && <p className="text-xs text-gray-500">Added {new Date(lead.created_at).toLocaleDateString()}</p>}
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
                    <td className="px-3 py-4 text-sm text-gray-900 font-medium">{lead.email}</td>
                    <td className="px-3 py-4 text-sm text-gray-900 font-medium">{lead.company}</td>
                    <td className="px-3 py-4 text-sm text-gray-900">{lead.position}</td>
                    <td className="px-3 py-4 text-sm text-gray-900">{lead.location}</td>
                    <td className="px-3 py-4">
                      <button
                        onClick={() => handleProfileClick(lead)}
                        className="inline-flex items-center justify-center p-2 rounded-full text-blue-600 bg-blue-50 cursor-pointer hover:text-blue-700 hover:bg-blue-100 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="View profile"
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
                        >
                          {lead.treated ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button onClick={() => { setEditingLead(lead); setIsModalOpen(true); }} className="p-1 text-gray-500 hover:text-gray-700"><PencilIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteLead(lead.id)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5" /></button>
                        <button onClick={() => { setEditingLead(lead); setIsComposerOpen(true); }} className="p-1 text-gray-500 hover:text-gray-700"><EnvelopeIcon className="h-5 w-5" /></button>
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
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, sortedLeads.length)}</span> of <span className="font-medium">{sortedLeads.length}</span> results
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