const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title:  { type: String, required: true, trim: true },
  goal:   { type: String, required: true, trim: true },
  aiGenerated: { type: Boolean, default: false },
  steps: [{
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    resources:   [{ title: String, url: String, type: String }],
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    order:       { type: Number },
  }],
  progressPercent: { type: Number, default: 0 },
}, { timestamps: true });

// ── Auto-compute progress ──
roadmapSchema.methods.computeProgress = function() {
  if (!this.steps.length) return 0;
  const done = this.steps.filter(s => s.isCompleted).length;
  this.progressPercent = Math.round((done / this.steps.length) * 100);
  return this.progressPercent;
};

module.exports = mongoose.model('Roadmap', roadmapSchema);
