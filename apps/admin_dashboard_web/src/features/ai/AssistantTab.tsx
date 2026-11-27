import { useState, type FormEvent } from 'react';
import {
  Bot,
  Check,
  LockKeyhole,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

type Message = {
  id: string;
  role: 'admin' | 'assistant';
  text: string;
};

type Props = {
  onRefresh: () => void;
};

const prompts = [
  'إزاي لوحة الإدارة تساعد في تنظيم الرحلات؟',
  'اقترح مؤشرات لمتابعة الطلب على الخطوط',
  'إيه خطوات التعامل مع شكوى سلامة؟',
];

export function AssistantTab({ onRefresh }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'أهلًا بيك! أنا مساعد مشروع NQLa. أقدر أجاوب على أسئلة عامة عن النقل ولوحة الإدارة. حاليًا مش متصل ببيانات الرحلات أو السائقين الفعلية.',
    },
  ]);

  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async (event?: FormEvent, prepared?: string) => {
    event?.preventDefault();

    const text = (prepared ?? question).trim();

    if (!text || sending) return;

    setQuestion('');
    setError('');
    setSending(true);

    const userMessage: Message = {
      id: `q-${Date.now()}`,
      role: 'admin',
      text,
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      if (!apiBaseUrl) {
        throw new Error('عنوان الـAPI مش موجود في ملف .env.local.');
      }

      const response = await fetch(`${apiBaseUrl}/admin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      const data: {
        reply?: string;
        error?: string;
        message?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'فشل الاتصال بمساعد الشات.',
        );
      }

      if (!data.reply) {
        throw new Error('الـAPI ما رجّعش رد.');
      }

      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.reply!,
        },
      ]);

      onRefresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'حصل خطأ أثناء إرسال الرسالة.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ai-assistant-layout">
      <section className="panel ai-chat-panel">
        <div className="ai-chat-header">
          <span className="ai-chat-avatar">
            <Bot size={21} />
          </span>

          <div>
            <b>مساعد النقل · Admin</b>
            <small>
              <i /> متصل بـGemini عبر الـbackend
            </small>
          </div>

          <span className="ai-nonproduction-tag">AI</span>
        </div>

        <div className="ai-chat-messages" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`ai-chat-message ${message.role}`}
            >
              <span className="ai-message-avatar">
                {message.role === 'admin' ? 'م' : <Bot size={15} />}
              </span>

              <div className="ai-message-body">
                <small>
                  {message.role === 'admin' ? 'المشرف' : 'مساعد Gemini'}
                </small>
                <p>{message.text}</p>
              </div>
            </article>
          ))}

          {sending && (
            <div className="ai-chat-thinking">
              <span className="spinner" />
              جارٍ انتظار رد Gemini…
            </div>
          )}
        </div>

        {error && (
          <div className="inline-error">
            <span>{error}</span>
          </div>
        )}

        <div className="ai-prompt-chips">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void send(undefined, prompt)}
              disabled={sending}
            >
              <Sparkles size={13} />
              {prompt}
            </button>
          ))}
        </div>

        <form
          className="ai-chat-composer"
          onSubmit={(event) => void send(event)}
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="اسأل سؤالًا عامًا عن النقل أو لوحة الإدارة…"
            aria-label="سؤال للمساعد"
          />

          <button
            className="button button-primary"
            type="submit"
            disabled={sending || !question.trim()}
          >
            <Send size={15} />
            إرسال
          </button>
        </form>
      </section>

      <aside className="panel ai-agent-policy">
        <span className="ai-agent-policy-icon">
          <LockKeyhole size={19} />
        </span>

        <span className="panel-kicker">FR-14.1–14.5 · AIQ-06</span>
        <h2>ضوابط المساعد المقترحة</h2>

        <ul>
          <li>
            <Check size={14} /> استرجاع المعلومات والخدمات المعتمدة فقط.
          </li>
          <li>
            <Check size={14} /> توضيح مصدر المعلومات وحداثتها عند ربط مصادر بيانات.
          </li>
          <li>
            <Check size={14} /> تقييد البيانات بحسب دور المستخدم الحقيقي.
          </li>
          <li>
            <Check size={14} /> الامتناع عند نقص الدليل أو تجاوز الصلاحية.
          </li>
          <li>
            <Check size={14} /> تأكيد بشري قبل أي إجراء تشغيلي حساس.
          </li>
          <li>
            <Check size={14} /> تسجيل الطلبات في سجل تدقيق محمي.
          </li>
        </ul>

        <div className="ai-agent-disclaimer">
          <ShieldAlert size={14} />
          <span>
            المساعد متصل بـGemini، لكنه حاليًا غير متصل ببيانات الرحلات
            والسائقين، ولا يستخدم RAG أو مصادقة فعلية. ما تدخلش بيانات شخصية أو
            معلومات حساسة.
          </span>
        </div>
      </aside>
    </div>
  );
}
