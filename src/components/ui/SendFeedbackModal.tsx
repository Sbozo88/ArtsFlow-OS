import React, { useState } from 'react';
import { MessageSquare, Star, X, CheckCircle2, Send, AlertCircle } from 'lucide-react';
import { feedbackService } from '../../services/feedbackService';
import { useAuth } from '../../contexts/AuthContext';
import type { CustomerFeedbackCategory } from '../../types';

interface SendFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendFeedbackModal: React.FC<SendFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { authUser, user, organisationId } = useAuth();

  const [category, setCategory] = useState<CustomerFeedbackCategory>('ease_of_use');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [improvements, setImprovements] = useState('');
  const [canContact, setCanContact] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !authUser) return;

    if (!comment.trim()) {
      setError('Please let us know what worked well or your general thoughts.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await feedbackService.submitFeedback(authUser.uid, {
        organisationId,
        category,
        rating,
        comment: comment.trim(),
        improvements: improvements.trim() || undefined,
        canContact,
        submittedByName: authUser.displayName || user?.displayName || authUser.email || undefined,
        submittedByEmail: user?.email || authUser.email || undefined
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Share Pilot Feedback</h2>
            <p className="text-xs text-slate-500">Your operational feedback directly guides ArtsFlow OS development.</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Thank you for your feedback!</h3>
            <p className="text-xs text-slate-500">The founding engineering team will review your comments promptly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Overall Experience (1 to 5 Stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating === 5
                    ? 'Exceptional'
                    : rating === 4
                    ? 'Very Good'
                    : rating === 3
                    ? 'Good'
                    : rating === 2
                    ? 'Fair'
                    : 'Needs Work'}
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Area of Feedback
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CustomerFeedbackCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="ease_of_use">Overall Ease of Use & Navigation</option>
                <option value="onboarding">Onboarding & Initial Setup</option>
                <option value="learners">Learner & Guardian Records</option>
                <option value="attendance">Registers & Attendance Tracking</option>
                <option value="music">Music Instruments & Practice</option>
                <option value="dance">Dance Levels & Choreography</option>
                <option value="finance">School Tuition & Invoicing</option>
                <option value="events">Events & Performances</option>
                <option value="parent_portal">Parent / Guardian Portal</option>
                <option value="bug">Report a Bug / Glitch</option>
                <option value="missing_feature">Request a Missing Feature</option>
                <option value="other">Other Feedback</option>
              </select>
            </div>

            {/* What worked well */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                What worked well?
              </label>
              <textarea
                rows={3}
                required
                placeholder="Tell us what you liked or found useful in this module..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* What could be improved */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                What could be improved? (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Any friction points, missing options, or suggestions..."
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Permission to contact */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="contactPermission"
                checked={canContact}
                onChange={(e) => setCanContact(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <label htmlFor="contactPermission" className="text-xs text-slate-600 cursor-pointer">
                The ArtsFlow product team may contact me regarding this feedback.
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
