import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineX, HiOutlinePhotograph } from "react-icons/hi";
import api from "../api/axios.js";

const CATEGORIES = [
  "Technology", "Education", "Entertainment", "Sports", "Politics",
  "Business", "Lifestyle", "Gaming", "Science", "General",
];

const CreatePoll = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    question: "",
    description: "",
    type: "single",
    category: "General",
    tags: "",
    expiresAt: "",
    allowComments: true,
    allowAnonymous: true,
  });
  const [options, setOptions] = useState(["", ""]);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateOption = (i, value) => {
    const next = [...options];
    next[i] = value;
    setOptions(next);
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i) => {
    if (options.length <= 2) return toast.error("Minimum 2 options required");
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      toast.error("Provide at least 2 options");
      return;
    }
    if (!form.question.trim()) {
      toast.error("Poll question is required");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("question", form.question);
      data.append("description", form.description);
      data.append("type", form.type);
      data.append("category", form.category);
      data.append("options", JSON.stringify(cleanOptions));
      data.append(
        "tags",
        JSON.stringify(form.tags.split(",").map((t) => t.trim()).filter(Boolean))
      );
      if (form.expiresAt) data.append("expiresAt", form.expiresAt);
      data.append("allowComments", form.allowComments);
      data.append("allowAnonymous", form.allowAnonymous);
      if (imageFile) data.append("image", imageFile);

      const res = await api.post("/polls", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Poll created! 🎉");
      navigate(`/poll/${res.data.poll._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Create a Poll</h1>
      <p className="text-gray-500 text-sm mb-6">Ask a question, add your options, and let the votes roll in.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary-100 shadow-card p-5 sm:p-7 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Poll Question</label>
          <input
            required
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="What is your favorite programming language?"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add more context to your poll..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Poll Type</label>
          <div className="flex gap-3">
            {[
              { value: "single", label: "Single Choice" },
              { value: "multiple", label: "Multiple Choice" },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, type: t.value })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  form.type === t.value
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-gray-200 text-gray-600 hover:border-primary-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Options</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <HiOutlineX />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
          >
            <HiOutlinePlus /> Add option
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Expiration Date (optional)</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="webdev, coding, react"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Poll Image (optional)</label>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-primary-200 rounded-xl py-6 cursor-pointer hover:border-primary-400 transition-colors">
            {preview ? (
              <img src={preview} alt="" className="max-h-32 rounded-lg" />
            ) : (
              <span className="flex items-center gap-2 text-gray-400 text-sm">
                <HiOutlinePhotograph className="text-xl" /> Click to upload
              </span>
            )}
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.allowComments}
              onChange={(e) => setForm({ ...form, allowComments: e.target.checked })}
              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-400"
            />
            Allow comments
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.allowAnonymous}
              onChange={(e) => setForm({ ...form, allowAnonymous: e.target.checked })}
              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-400"
            />
            Allow anonymous voting
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-soft"
        >
          {loading ? "Publishing..." : "Publish Poll"}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;
