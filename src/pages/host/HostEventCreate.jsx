import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function HostEventCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "Wedding",
    start_date: "",
    end_date: "",
    longitude: "",
    latitude: "",
    budget: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.title || !form.event_type || !form.start_date || !form.end_date || !form.longitude || !form.latitude || !form.budget) {
      return "Please fill all required fields";
    }
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const now = new Date();
    if (start <= now) return "Start date must be in the future";
    if (end <= start) return "End date must be after start date";
    const lng = parseFloat(form.longitude);
    const lat = parseFloat(form.latitude);
    if (isNaN(lng) || isNaN(lat)) return "Coordinates must be numbers";
    if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180";
    if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90";
    const budgetAmount = parseFloat(form.budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) return "Budget must be a positive number";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date,
        location: {
          type: "Point",
          coordinates: [parseFloat(form.longitude), parseFloat(form.latitude)],
        },
        budget: parseFloat(form.budget),
      };

      const res = await axios.post(`${serverURL}/host/events/create`, payload, {
        withCredentials: true,
      });
      const created = res.data?.data;
      navigate(`/host/events/${created._id}`, {
        state: {
          toast: { type: "success", message: "Event created successfully" },
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create event";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Create Event</h1>
          <button onClick={() => navigate(-1)} className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition">Back</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <h2 className="text-white text-2xl font-bold">Event Details</h2>
            <p className="text-white/80">Provide clear, accurate information for a successful event</p>
            {/* Date summary chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {form.start_date && (
                <span className="px-3 py-1 text-xs bg-white/20 text-white rounded-full">
                  Start: {new Date(form.start_date).toLocaleString()}
                </span>
              )}
              {form.end_date && (
                <span className="px-3 py-1 text-xs bg-white/20 text-white rounded-full">
                  End: {new Date(form.end_date).toLocaleString()}
                </span>
              )}
              {form.event_type && (
                <span className="px-3 py-1 text-xs bg-white/20 text-white rounded-full">
                  Type: {String(form.event_type).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-0 md:p-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}
            {/* Two-column layout: form left, preview right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Form column spans 2 */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., Dream Wedding, Corporate Summit" />
                    <p className="mt-1 text-xs text-gray-500">Use a short, descriptive title.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select name="event_type" value={form.event_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                      <option value="Wedding">Wedding</option>
                      <option value="function">Function</option>
                      <option value="corporate">Corporate</option>
                      <option value="festival">Festival</option>
                      <option value="exhibition">Exhibition</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="workshop">Workshop</option>
                      <option value="webinar">Webinar</option>
                      <option value="networking">Networking</option>
                      <option value="fundraiser">Fundraiser</option>
                      <option value="retreat">Retreat</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Select the type for themed visuals and matching organizers.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" rows={4} placeholder="Briefly describe the event" />
                  <p className="mt-1 text-xs text-gray-500">Include expected audience, venue specifics, and any special requirements.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                    <p className="mt-1 text-xs text-gray-500">Local date and time the event begins.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                    <p className="mt-1 text-xs text-gray-500">End time must be after the start time.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                    <input name="longitude" value={form.longitude} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 77.5946" />
                    <p className="mt-1 text-xs text-gray-500">Range: -180 to 180.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                    <input name="latitude" value={form.latitude} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 12.9716" />
                    <p className="mt-1 text-xs text-gray-500">Range: -90 to 90.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget (INR) *</label>
                    <input type="number" name="budget" value={form.budget} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 50000" />
                    <p className="mt-1 text-xs text-gray-500">Estimated total spend in INR.</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50">
                    {submitting ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </div>

              {/* Preview column */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="h-36 w-full overflow-hidden bg-gray-50">
                    <img
                      src={getEventTypeImage(form.event_type)}
                      alt={form.event_type || "Event"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900">{form.title || "Untitled Event"}</h3>
                    <p className="text-sm text-gray-600">{String(form.event_type || "").toUpperCase()}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-purple-50 text-purple-700 rounded-lg p-2 text-xs">
                        <span className="block font-semibold">Start</span>
                        <span>{form.start_date ? new Date(form.start_date).toLocaleString() : "—"}</span>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 rounded-lg p-2 text-xs">
                        <span className="block font-semibold">End</span>
                        <span>{form.end_date ? new Date(form.end_date).toLocaleString() : "—"}</span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-pink-50 text-pink-700 rounded-lg p-2 text-xs">
                        <span className="block font-semibold">Longitude</span>
                        <span>{form.longitude || "—"}</span>
                      </div>
                      <div className="bg-pink-50 text-pink-700 rounded-lg p-2 text-xs">
                        <span className="block font-semibold">Latitude</span>
                        <span>{form.latitude || "—"}</span>
                      </div>
                    </div>
                    <div className="mt-3 bg-amber-50 text-amber-700 rounded-lg p-2 text-sm">
                      <span className="font-semibold">Budget</span>: ₹ {form.budget ? Number(form.budget).toLocaleString() : "—"}
                    </div>
                    {form.description && (
                      <div className="mt-3 text-sm text-gray-700">
                        <span className="font-semibold">About</span>
                        <p className="mt-1 line-clamp-4">{form.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default HostEventCreate;