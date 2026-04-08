import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App";

function HostEventEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${serverURL}/host/events/${id}`, { withCredentials: true });
        const ev = res.data?.data;
        const coords = ev?.location?.coordinates || ["", ""];
        setForm({
          title: ev.title || "",
          description: ev.description || "",
          event_type: ev.event_type || "Wedding",
          start_date: formatDateTimeLocal(ev.start_date),
          end_date: formatDateTimeLocal(ev.end_date),
          longitude: coords[0]?.toString?.() || coords[0] || "",
          latitude: coords[1]?.toString?.() || coords[1] || "",
          budget: (() => {
            if (typeof ev.budget === "object" && ev.budget?.$numberDecimal) {
              return ev.budget.$numberDecimal;
            }
            const b = ev.budget?.toString?.() || ev.budget || "";
            return b.toString();
          })(),
        });
        setIsCompleted(ev.status === "completed");
        setError(null);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load event";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
    if (isCompleted) {
      setError("This event is completed and cannot be edited.");
      return;
    }
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

      await axios.put(`${serverURL}/host/events/edit/${id}`, payload, { withCredentials: true });
      navigate(`/host/events/${id}`, {
        state: {
          toast: { type: "success", message: "Event updated successfully" },
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update event";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Edit Event</h1>
          <button onClick={() => navigate(`/host/events/${id}`)} className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition">Back to Details</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <h2 className="text-white text-2xl font-bold">Update Event Information</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input name="title" value={form.title} onChange={handleChange} disabled={isCompleted} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select name="event_type" value={form.event_type} onChange={handleChange} disabled={isCompleted} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100">
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
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} disabled={isCompleted} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" rows={4} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange} disabled={isCompleted} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                <input type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange} disabled={isCompleted} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                <input name="longitude" value={form.longitude} onChange={handleChange} disabled={isCompleted} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                <input name="latitude" value={form.latitude} onChange={handleChange} disabled={isCompleted} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget (INR) *</label>
                <input type="number" name="budget" value={form.budget} onChange={handleChange} disabled={isCompleted} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => navigate(`/host/events/${id}`)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition">Cancel</button>
              {!isCompleted && (
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow disabled:opacity-50">
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default HostEventEdit;