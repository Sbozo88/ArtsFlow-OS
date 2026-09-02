import React from 'react';
import { MessageSquare, Calendar, Mail, AlertCircle } from 'lucide-react';
import { useGuardianMessages } from '../../../hooks/useGuardianMessages';

export const GuardianMessagesPage: React.FC = () => {
  const { messages, loading, error } = useGuardianMessages();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Inbox & Outbox
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">Announcements & Messages</h1>
        <p className="text-sm text-slate-500">
          Official communication history dispatched to your email and portal inbox.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Messages Yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any notices or messages in your communication history.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{msg.subject || 'Announcement'}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="uppercase font-bold text-indigo-600">{msg.communicationType}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{msg.sentAt?.split('T')[0]}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {msg.relatedLearnerName && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 self-start sm:self-auto">
                    Re: {msg.relatedLearnerName}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {msg.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
