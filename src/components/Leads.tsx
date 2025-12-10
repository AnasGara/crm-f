import React, { useState, useEffect } from "react";
import leadService, {
  Lead,
  CreateLeadData,
  UpdateLeadData,
} from "../services/leadsService";
import LeadForm from "./LeadForm";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Leads: React.FC<{ searchTerm?: string }> = ({ searchTerm }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Filtering state
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterCompany, setFilterCompany] = useState<string>("");
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [showOnlyUnseen, setShowOnlyUnseen] = useState<boolean>(false);
  const [sortNewestFirst, setSortNewestFirst] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await leadService.getLeads();
        setLeads(data);
      } catch (err) {
        setError("Failed to fetch leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Filter and sort leads
  // Remplacer la fonction filteredLeads par ceci :

  const filteredLeads = leads
    .filter((lead) => {
      // Helper function to safely check string values
      const safeToString = (value: any): string => {
        if (value === null || value === undefined) return "";
        return String(value).toLowerCase();
      };

      // Global search filter
      const matchesSearch = searchTerm
        ? safeToString(lead.full_name).includes(searchTerm.toLowerCase()) ||
          safeToString(lead.company).includes(searchTerm.toLowerCase()) ||
          safeToString(lead.position).includes(searchTerm.toLowerCase())
        : true;

      // Additional column filters
      const matchesLocation = filterLocation
        ? safeToString(lead.location).includes(filterLocation.toLowerCase())
        : true;

      const matchesCompany = filterCompany
        ? safeToString(lead.company).includes(filterCompany.toLowerCase())
        : true;

      const matchesPosition = filterPosition
        ? safeToString(lead.position).includes(filterPosition.toLowerCase())
        : true;

      // Filter by "unseen" if showOnlyUnseen is true
      const matchesSeenFilter = showOnlyUnseen ? !lead.seen : true;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCompany &&
        matchesPosition &&
        matchesSeenFilter
      );
    })
    // Sort by newest first (reverse order)
    .sort((a, b) => {
      if (sortNewestFirst) {
        // If you have createdAt property
        if (a.createdAt && b.createdAt) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        // Otherwise sort by descending ID (assuming higher IDs are newer)
        return b.id - a.id;
      } else {
        // Normal order (oldest first)
        if (a.createdAt && b.createdAt) {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        return a.id - b.id;
      }
    });
  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  const handleSaveLead = async (leadData: CreateLeadData | UpdateLeadData) => {
    try {
      if (editingLead) {
        const updatedLead = await leadService.updateLead(
          editingLead.id,
          leadData as UpdateLeadData
        );
        setLeads(
          leads.map((lead) => (lead.id === editingLead.id ? updatedLead : lead))
        );
      } else {
        const newLead = await leadService.createLead(
          leadData as CreateLeadData
        );
        setLeads([newLead, ...leads]); // Add new lead at the beginning
      }
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (err) {
      setError("Failed to save lead");
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      await leadService.deleteLead(id);
      setLeads(leads.filter((lead) => lead.id !== id));
      // Reset to first page if we deleted the last item on current page
      if (currentLeads.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError("Failed to delete lead");
    }
  };

  const handleMarkAsSeen = async (id: number) => {
    try {
      const leadToUpdate = leads.find((lead) => lead.id === id);
      if (leadToUpdate) {
        await leadService.updateLead(id, {
          ...leadToUpdate,
          seen: true,
        } as UpdateLeadData);

        setLeads(
          leads.map((lead) => (lead.id === id ? { ...lead, seen: true } : lead))
        );
      }
    } catch (err) {
      console.error("Failed to mark lead as seen:", err);
    }
  };

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset filters
  const resetFilters = () => {
    setFilterLocation("");
    setFilterCompany("");
    setFilterPosition("");
    setShowOnlyUnseen(false);
    setCurrentPage(1);
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

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all leads including their details
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              showFilters
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {(filterLocation ||
              filterCompany ||
              filterPosition ||
              showOnlyUnseen) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                Active
              </span>
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

      {/* Filters Section */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="filter-company"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company
              </label>
              <input
                type="text"
                id="filter-company"
                value={filterCompany}
                onChange={(e) => {
                  setFilterCompany(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by company..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="filter-position"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Position
              </label>
              <input
                type="text"
                id="filter-position"
                value={filterPosition}
                onChange={(e) => {
                  setFilterPosition(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by position..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="filter-location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location
              </label>
              <input
                type="text"
                id="filter-location"
                value={filterLocation}
                onChange={(e) => {
                  setFilterLocation(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter by location..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  View Options
                </label>
                <button
                  onClick={() => {
                    setShowOnlyUnseen(!showOnlyUnseen);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-medium flex items-center justify-center ${
                    showOnlyUnseen
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {showOnlyUnseen ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4 mr-2" />
                      Showing Unseen Only
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Show All
                    </>
                  )}
                </button>
              </div>

              <div>
                <button
                  onClick={() => {
                    setSortNewestFirst(!sortNewestFirst);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-medium flex items-center justify-center ${
                    sortNewestFirst
                      ? "bg-purple-50 border-purple-300 text-purple-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {sortNewestFirst ? (
                    <>
                      <ArrowDownIcon className="h-4 w-4 mr-2" />
                      Newest First
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon className="h-4 w-4 mr-2" />
                      Oldest First
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredLeads.length}</span> leads
              found
              {filteredLeads.length !== leads.length &&
                ` (filtered from ${leads.length} total)`}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <LeadForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        lead={editingLead}
      />

      {/* Table Container */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900"
                >
                  <div className="flex items-center">
                    Name
                    {showOnlyUnseen && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Unseen
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Company
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Position
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Profile
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg
                        className="mx-auto h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No leads found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {filteredLeads.length === 0 && leads.length > 0
                          ? "Try changing your filters"
                          : "Get started by adding your first lead"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      !lead.seen ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-blue-600">
                            {lead.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {lead.full_name}
                            </p>
                            {!lead.seen && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                New
                              </span>
                            )}
                          </div>
                          {lead.createdAt && (
                            <p className="text-xs text-gray-500">
                              Added{" "}
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {lead.company}
                      </div>
                      {lead.industry && (
                        <div className="text-xs text-gray-500">
                          {lead.industry}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900">
                        {lead.position}
                      </div>
                      {lead.seniority && (
                        <div className="text-xs text-gray-500">
                          {lead.seniority}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900">
                        {lead.location}
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <a
                        href={lead.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          // Mark as seen when clicking on profile
                          if (!lead.seen) {
                            handleMarkAsSeen(lead.id);
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                      >
                        View Profile
                      </a>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                        >
                          Delete
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
        {currentLeads.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(endIndex, filteredLeads.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredLeads.length}</span>{" "}
                  results
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <label
                    htmlFor="items-per-page"
                    className="text-sm text-gray-700 mr-2"
                  >
                    Show:
                  </label>
                  <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
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
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>

                <div className="text-sm text-gray-700 hidden sm:block">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;
