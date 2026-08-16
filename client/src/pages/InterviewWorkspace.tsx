import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Grid, Chip, Button, CircularProgress, MenuItem,
  TextField, Paper, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, Rating, Alert
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  HourglassTop as PendingIcon,
  WarningAmber as WarningIcon,
  Refresh as RefreshIcon,
  PersonOutlined as PersonIcon,
  Psychology as SignalIcon,
  AssignmentTurnedIn as CoverageIcon,
  LightbulbOutlined as IdeaIcon,
  FormatQuote as QuoteIcon,
  DeleteOutline as DeleteIcon,
  ContentPaste as PasteIcon
} from '@mui/icons-material';
import { interviewService } from '../api/interview.service';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Interview, CopilotAnalysis, CopilotFeedbackDraft, Recommendation } from '../api/types';
import { VoiceWaveVisualizer } from '../components/VoiceWaveVisualizer';
import { showToast } from '../utils/toast';

interface TranscriptLine {
  id: string;
  speaker: 'Interviewer' | 'Candidate';
  text: string;
  timestamp: string;
}

const PRESET_SCRIPTS: Record<string, Array<{ speaker: 'Interviewer' | 'Candidate'; text: string }>> = {
  system_design: [
    { speaker: 'Interviewer', text: 'Welcome! Let us dive into System Design. How would you design a high-throughput real-time notification engine for millions of users?' },
    { speaker: 'Candidate', text: 'I would decouple API ingestion from delivery using Apache Kafka as an event stream, backed by Redis for rate limiting and online user session routing.' },
    { speaker: 'Interviewer', text: 'Great. How do you handle push notification retries and database bottlenecks during traffic spikes?' },
    { speaker: 'Candidate', text: 'We use exponential backoff with dead-letter queues (DLQ) in RabbitMQ/Kafka, and write status updates asynchronously into PostgreSQL using connection pooling and batch inserts.' },
    { speaker: 'Interviewer', text: 'Excellent. What about multi-region failover and database read scaling?' },
    { speaker: 'Candidate', text: 'We deploy primary-replica PostgreSQL clusters with read-replicas distributed globally, cached via Redis Cluster to maintain under 50ms read latency.' }
  ],
  frontend_react: [
    { speaker: 'Interviewer', text: 'Thanks for joining. Can you explain your approach to state management and performance optimization in complex React applications?' },
    { speaker: 'Candidate', text: 'I structure state locally first, elevate to Context or Redux Toolkit only for global state, and eliminate re-renders using React.memo, useMemo, and useCallback hooks.' },
    { speaker: 'Interviewer', text: 'How do you handle micro-frontend architecture or code-splitting for large enterprise applications?' },
    { speaker: 'Candidate', text: 'We implement route-based dynamic imports via React.lazy and Suspense, coupled with Webpack Module Federation for shared component libraries.' },
    { speaker: 'Interviewer', text: 'How do you monitor web vitals and frontend bundle size?' },
    { speaker: 'Candidate', text: 'We integrate Lighthouse CI into our build pipeline to enforce LCP under 2.5s and use source-map-explorer to tree-shake third-party dependencies.' }
  ],
  leadership_cultural: [
    { speaker: 'Interviewer', text: 'Can you share an experience where you had a major architectural disagreement with a senior teammate?' },
    { speaker: 'Candidate', text: 'Yes, our tech lead wanted to rewrite our monolith in Rust, while I advocated for modularizing Express.js services. I built a quick benchmark prototype to compare execution speeds and developer velocity.' },
    { speaker: 'Interviewer', text: 'How did the team resolve the disagreement?' },
    { speaker: 'Candidate', text: 'We agreed that developer velocity and team domain expertise outweighed raw microsecond gains. We modularized Express services and saved 3 months of migration risk.' }
  ]
};

const HR_QUESTION_BANK = [
  {
    category: 'Background & Motivation',
    question: 'Can you walk me through your professional journey and what attracted you to this position?',
    reasoning: 'Evaluates career alignment, candidate motivation, and background relevance.'
  },
  {
    category: 'Notice Period & Logistics',
    question: 'What is your current notice period, location preference, and compensation expectation range?',
    reasoning: 'Verifies availability, timeline, and employment logistics.'
  },
  {
    category: 'Work Ethic & Collaboration',
    question: 'How do you handle working under tight deadlines with cross-functional product and engineering teams?',
    reasoning: 'Tests pressure management and collaboration style.'
  },
  {
    category: 'Career Growth',
    question: 'What key technical or leadership skills do you hope to develop over the next 2 to 3 years?',
    reasoning: 'Assesses long-term retention potential and personal ambition.'
  }
];

const MANAGERIAL_QUESTION_BANK = [
  {
    category: 'Project Ownership',
    question: 'Can you describe a complex technical initiative you led from initial discovery through production release?',
    reasoning: 'Assesses end-to-end execution, technical ownership, and delivery track record.'
  },
  {
    category: 'Conflict Resolution',
    question: 'Tell me about a situation where you had a significant technical disagreement with a peer or stakeholder. How did you resolve it?',
    reasoning: 'Evaluates stakeholder management, active listening, and conflict resolution.'
  },
  {
    category: 'Agile & Priority Management',
    question: 'How do you re-prioritize deliverables when sprint targets or business requirements change unexpectedly mid-cycle?',
    reasoning: 'Tests adaptability, risk mitigation, and agile planning.'
  },
  {
    category: 'Mentorship & Standards',
    question: 'How do you foster technical quality, code reviews, and skill growth within your engineering squad?',
    reasoning: 'Measures team leadership, quality standards, and mentorship mindset.'
  }
];

const CULTURAL_QUESTION_BANK = [
  {
    category: 'Values & Adaptability',
    question: 'Describe a scenario where you faced unexpected organizational change. How did you adapt and support your peers?',
    reasoning: 'Assesses flexibility, resilience, and alignment with company culture.'
  },
  {
    category: 'Constructive Feedback',
    question: 'How do you handle receiving critical feedback on your work from teammates or leadership?',
    reasoning: 'Evaluates self-awareness, growth mindset, and openness to feedback.'
  },
  {
    category: 'Empathy & Support',
    question: 'Can you share an example of how you assisted a struggling teammate to help them succeed on a deadline?',
    reasoning: 'Tests peer support, empathy, and collaborative spirit.'
  },
  {
    category: 'Ownership & Accountability',
    question: 'Share an example of a project that did not meet its initial goals. What accountability did you take and what did you learn?',
    reasoning: 'Measures personal accountability, learning orientation, and honesty.'
  }
];

const InterviewWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const isCandidateUser = user?.role === 'CANDIDATE';
  const currentSpeaker: 'Interviewer' | 'Candidate' = isCandidateUser ? 'Candidate' : 'Interviewer';

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live Timer (Activated only when candidate has joined session)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Transcript state
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [inputDialogue, setInputDialogue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [rawPasteText, setRawPasteText] = useState('');

  // AI Copilot State
  const [copilotAnalysis, setCopilotAnalysis] = useState<CopilotAnalysis | null>(null);
  const [regeneratingQuestions, setRegeneratingQuestions] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [usedQuestionTexts, setUsedQuestionTexts] = useState<string[]>([]);

  // Feedback Draft & End Interview State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState<CopilotFeedbackDraft | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Scorecard editable form fields
  const [technicalRating, setTechnicalRating] = useState<number>(8);
  const [communicationRating, setCommunicationRating] = useState<number>(8);
  const [problemSolvingRating, setProblemSolvingRating] = useState<number>(8);
  const [cultureFitRating, setCultureFitRating] = useState<number>(8);
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation>('YES');

  // Simulation script state
  const [selectedScriptKey, setSelectedScriptKey] = useState<string>('');

  const isCandidatePresent = Boolean(
    isCandidateUser ||
    (interview?.transcript && (
      interview.transcript.toLowerCase().includes('candidate:') ||
      interview.transcript.includes('[SYSTEM]: Candidate joined')
    )) ||
    transcriptLines.some(l => l.speaker === 'Candidate')
  );

  const getSessionStartTimeMs = (rawTranscript?: string | null): number | null => {
    if (rawTranscript) {
      const match = rawTranscript.match(/\[SYSTEM\]: Candidate joined live session @ (\d+)/);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    if (id) {
      const local = localStorage.getItem(`session_start_ms_${id}`);
      if (local) {
        const parsed = parseInt(local, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return null;
  };

  // Sync candidate joined presence marker with timestamp
  useEffect(() => {
    if (isCandidateUser && id && interview) {
      const currentText = interview.transcript || '';
      if (!currentText.includes('[SYSTEM]: Candidate joined live session')) {
        const nowMs = Date.now();
        localStorage.setItem(`session_start_ms_${id}`, nowMs.toString());
        const updatedText = currentText
          ? `${currentText}\n[SYSTEM]: Candidate joined live session @ ${nowMs}`
          : `[SYSTEM]: Candidate joined live session @ ${nowMs}`;
        interviewService.saveTranscript(id, updatedText).catch(() => { });
      }
    }
  }, [isCandidateUser, id, interview?.id]);

  // Activate timer ONLY after candidate has joined and session is IN_PROGRESS
  useEffect(() => {
    if (isCandidatePresent && interview?.status === 'IN_PROGRESS') {
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  }, [isCandidatePresent, interview?.status]);

  // Persistent Timer Effect (Preserves elapsed timer across page refreshes)
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && interview) {
      const startMs = getSessionStartTimeMs(interview.transcript);
      if (startMs) {
        const updateTimer = () => {
          const nowMs = Date.now();
          const elapsedSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
          setElapsedSeconds(elapsedSecs);
        };
        updateTimer();
        interval = setInterval(updateTimer, 1000);
      } else {
        interval = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerActive, interview?.transcript, id]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to parse transcript string into TranscriptLine items
  const parseLines = (rawTranscript?: string | null): TranscriptLine[] => {
    if (!rawTranscript) return [];
    return rawTranscript.split('\n').filter(Boolean).map((lineStr, idx) => {
      const isCand = lineStr.toLowerCase().startsWith('candidate:');
      const isInter = lineStr.toLowerCase().startsWith('interviewer:');
      let spk: 'Interviewer' | 'Candidate' = 'Interviewer';
      let txt = lineStr;

      if (isCand) {
        spk = 'Candidate';
        txt = lineStr.replace(/^candidate:\s*/i, '');
      } else if (isInter) {
        spk = 'Interviewer';
        txt = lineStr.replace(/^interviewer:\s*/i, '');
      }

      return {
        id: `line-${idx}`,
        speaker: spk,
        text: txt,
        timestamp: ''
      };
    });
  };

  // Generate full transcript string
  const getFullTranscriptText = () => {
    return transcriptLines.map((l) => `${l.speaker}: ${l.text}`).join('\n');
  };

  // Fetch Interview details
  const fetchInterview = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await interviewService.getInterviewById(id);

      if (!isCandidateUser && (data.status === 'SCHEDULED' || data.status === 'RESCHEDULED')) {
        try {
          await interviewService.updateInterviewStatus(id, 'IN_PROGRESS');
          data.status = 'IN_PROGRESS';
        } catch (statusErr) {
          console.error('Failed to set IN_PROGRESS status on workspace mount', statusErr);
        }
      }

      setInterview(data);

      if (data.transcript) {
        const lines = parseLines(data.transcript);
        setTranscriptLines(lines);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load interview workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterview();
  }, [id]);

  // Real-Time Transcript Polling Effect (every 2 seconds for live dialogue sync across Candidate and Interviewer)
  useEffect(() => {
    if (!id || loading) return;
    const interval = setInterval(async () => {
      try {
        const latest = await interviewService.getInterviewById(id);

        // Auto-end session for candidate if interviewer concluded session
        if (isCandidateUser && latest.status === 'COMPLETED') {
          setIsTimerActive(false);
          setError('The interviewer has concluded this session. Redirecting to applications portal...');
          setTimeout(() => {
            navigate('/candidate-portal/applications');
          }, 2200);
          return;
        }

        if (latest.transcript !== undefined) {
          const freshText = latest.transcript || '';
          const currentText = getFullTranscriptText();
          if (freshText !== currentText) {
            const parsed = parseLines(freshText);
            setTranscriptLines(parsed);
            if (!isCandidateUser && freshText.trim()) {
              runCopilotAnalysis(freshText);
            }
          }
        }
      } catch (err) {
        // silent polling catch
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [id, loading, isCandidateUser, transcriptLines]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptLines]);

  // 1. Run Copilot Real-Time Analysis (Updates Coverage, Signals, & Insights ONLY — DOES NOT touch suggestedQuestions)
  const runCopilotAnalysis = async (customTranscript?: string) => {
    if (!id || isCandidateUser || interview?.type !== 'TECHNICAL') return;
    const textToAnalyze = customTranscript ?? getFullTranscriptText();
    try {
      const data: CopilotAnalysis = await interviewService.analyzeCopilot(id, textToAnalyze);
      setCopilotAnalysis((prev) => ({
        ...data,
        suggestedQuestions: (prev?.suggestedQuestions && prev.suggestedQuestions.length > 0)
          ? prev.suggestedQuestions
          : (data.suggestedQuestions || [])
      }));
    } catch (err) {
      console.error('Failed to run AI Copilot analysis', err);
    }
  };

  // 2. Dedicated Technical Questions Regenerator (Executed ONLY on Regenerate Button click or Topic Selection)
  const handleRegenerateQuestions = async (targetTopicOverride?: string | null) => {
    if (!id || isCandidateUser || interview?.type !== 'TECHNICAL') return;
    const activeTopic = targetTopicOverride !== undefined ? (targetTopicOverride || undefined) : (selectedTopic || undefined);
    setRegeneratingQuestions(true);
    try {
      const res = await interviewService.regenerateCopilotQuestions(id, activeTopic);
      if (res && res.suggestedQuestions) {
        setCopilotAnalysis((prev) => prev ? {
          ...prev,
          suggestedQuestions: res.suggestedQuestions
        } : {
          coverage: [],
          suggestedQuestions: res.suggestedQuestions,
          resumeInsights: [],
          signals: { answerQuality: 'Moderate', technicalDepth: '', confidenceClarity: '', redFlags: [] }
        });
      }
    } catch (err) {
      console.error('Failed to regenerate copilot questions', err);
    } finally {
      setRegeneratingQuestions(false);
    }
  };

  const getTopicQuestionsCount = (topicName: string) => {
    const tLower = topicName.toLowerCase();
    const usedCount = usedQuestionTexts.filter(q => q.toLowerCase().includes(tLower)).length;
    const transcriptCount = transcriptLines.filter(l => l.text.toLowerCase().includes(tLower)).length;
    return Math.max(usedCount, transcriptCount);
  };

  const getTopicStatus = (topicName: string, initialStatus?: string): 'COVERED' | 'IN_PROGRESS' | 'GAP' => {
    const count = getTopicQuestionsCount(topicName);
    if (count >= 3) return 'COVERED';
    if (count >= 1) return 'IN_PROGRESS';
    if (initialStatus === 'COVERED' && count > 0) return 'COVERED';
    if (initialStatus === 'IN_PROGRESS' && count > 0) return 'IN_PROGRESS';
    return 'GAP';
  };

  // Initial Copilot trigger once interview loads (Only for Technical Round)
  useEffect(() => {
    if (interview && !isCandidateUser && interview.type === 'TECHNICAL') {
      runCopilotAnalysis();
      handleRegenerateQuestions();
    }
  }, [interview?.id, interview?.type, isCandidateUser]);

  // Add dialogue line
  const handleAddDialogue = () => {
    if (!inputDialogue.trim()) return;
    const newLine: TranscriptLine = {
      id: `line-${Date.now()}`,
      speaker: currentSpeaker,
      text: inputDialogue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...transcriptLines, newLine];
    setTranscriptLines(updated);
    setInputDialogue('');

    const updatedText = updated.map((l) => `${l.speaker}: ${l.text}`).join('\n');
    interviewService.saveTranscript(id!, updatedText).catch(() => { });
    if (!isCandidateUser) {
      runCopilotAnalysis(updatedText);
    }
  };

  // Preset script loader simulator (Only for Interviewer/Recruiter/Admin)
  const handleRunPresetScript = async (key: string) => {
    if (!key || !PRESET_SCRIPTS[key] || isCandidateUser) return;
    setSelectedScriptKey(key);
    const script = PRESET_SCRIPTS[key];
    let currentLines = [...transcriptLines];

    for (let i = 0; i < script.length; i++) {
      const item = script[i];
      const newLine: TranscriptLine = {
        id: `preset-${Date.now()}-${i}`,
        speaker: item.speaker,
        text: item.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      currentLines = [...currentLines, newLine];
      setTranscriptLines(currentLines);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    const updatedText = currentLines.map((l) => `${l.speaker}: ${l.text}`).join('\n');
    interviewService.saveTranscript(id!, updatedText).catch(() => { });
    runCopilotAnalysis(updatedText);
    setSelectedScriptKey('');
  };

  // Web Speech API Voice Recognition
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast.error('Speech Recognition is not supported by your browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (fullTranscript) {
          setInputDialogue(fullTranscript);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Handle Paste Full Transcript
  const handleApplyPasteTranscript = () => {
    if (!rawPasteText.trim()) return;
    const rawLines = rawPasteText.split('\n').filter(Boolean);
    const parsed: TranscriptLine[] = rawLines.map((lineStr, idx) => {
      const isCand = lineStr.toLowerCase().startsWith('candidate:');
      const isInter = lineStr.toLowerCase().startsWith('interviewer:');
      let spk: 'Interviewer' | 'Candidate' = currentSpeaker;
      let txt = lineStr;

      if (isCand) {
        spk = 'Candidate';
        txt = lineStr.replace(/^candidate:\s*/i, '');
      } else if (isInter) {
        spk = 'Interviewer';
        txt = lineStr.replace(/^interviewer:\s*/i, '');
      }

      return {
        id: `paste-${idx}-${Date.now()}`,
        speaker: spk,
        text: txt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });

    setTranscriptLines(parsed);
    setPasteModalOpen(false);
    setRawPasteText('');

    const updatedText = parsed.map((l) => `${l.speaker}: ${l.text}`).join('\n');
    interviewService.saveTranscript(id!, updatedText).catch(() => { });
    if (!isCandidateUser) {
      runCopilotAnalysis(updatedText);
    }
  };

  // Clear Transcript
  const handleClearTranscript = () => {
    if (window.confirm('Are you sure you want to clear the interview transcript?')) {
      setTranscriptLines([]);
      setCopilotAnalysis(null);
      interviewService.saveTranscript(id!, '').catch(() => { });
    }
  };

  // Trigger End Interview & Feedback Draft Modal (Interviewer Only)
  const handleOpenEndInterviewModal = async () => {
    setIsTimerActive(false);
    setFeedbackModalOpen(true);
    setGeneratingDraft(true);

    try {
      const fullText = getFullTranscriptText();
      const draft: CopilotFeedbackDraft = await interviewService.generateCopilotFeedback(id!, fullText);
      setFeedbackDraft(draft);

      setTechnicalRating(draft.technicalRating || 8);
      setCommunicationRating(draft.communicationRating || 8);
      setProblemSolvingRating(draft.problemSolvingRating || 8);
      setCultureFitRating(draft.cultureFitRating || 8);
      setStrengths(draft.strengths || '');
      setWeaknesses(draft.weaknesses || '');
      setComments(draft.comments || '');
      setRecommendation(draft.recommendation || 'YES');
    } catch (err) {
      console.error('Failed to generate feedback draft', err);
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Submit Final Feedback Scorecard
  const handleSubmitFeedback = async () => {
    if (!id || !interview) return;
    setSubmittingFeedback(true);
    try {
      await apiClient.post(`/interviews/${id}/feedback`, {
        technicalRating,
        communicationRating,
        problemSolvingRating,
        cultureFitRating,
        strengths,
        weaknesses,
        comments,
        recommendation
      });

      await interviewService.updateInterviewStatus(id, 'COMPLETED');
      setFeedbackModalOpen(false);
      navigate(isCandidateUser ? '/candidate-portal/applications' : `/candidates/${interview.candidateId}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit feedback scorecard');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="75vh">
        <CircularProgress size={36} sx={{ color: '#818cf8' }} />
      </Box>
    );
  }

  if (error || !interview) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Interview session not found'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2, color: '#969DAA' }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (interview.status === 'COMPLETED') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="75vh" p={3}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            maxWidth: 500,
            textAlign: 'center',
            bgcolor: '#101318',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px'
          }}
        >
          <CheckIcon sx={{ fontSize: 56, color: '#10b981', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', mb: 1 }}>
            Interview Session Concluded
          </Typography>
          <Typography variant="body2" sx={{ color: '#969DAA', mb: 3, lineHeight: 1.6, fontSize: '0.85rem' }}>
            This live interview session for <strong>{interview.candidate?.name || 'the candidate'}</strong> has been completed and submitted. The live copilot workspace is closed and can no longer be reopened.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(isCandidateUser ? '/candidate-portal/applications' : `/candidates/${interview.candidateId}`)}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#ffffff',
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: '8px'
            }}
          >
            {isCandidateUser ? 'Back to Applications' : 'View Candidate Profile'}
          </Button>
        </Paper>
      </Box>
    );
  }

  const candidate = interview.candidate;

  return (
    <Box
      sx={{
        height: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        gap: 1.5
      }}
    >
      {/* 1. TOP HEADER BAR */}
      <Paper
        elevation={0}
        sx={{
          p: 1.8,
          px: 2.5,
          bgcolor: '#101318',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate(isCandidateUser ? '/candidate-portal/applications' : `/candidates/${candidate?.id}`)}
            sx={{ color: '#969DAA', '&:hover': { color: '#F5F7FA' }, py: 0.5 }}
            size="small"
          >
            {isCandidateUser ? 'Applications' : 'Candidate'}
          </Button>

          <Box>
            <Box display="flex" alignItems="center" gap={1.2}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {candidate?.name || 'Candidate Interview'}
              </Typography>
              <Chip
                label={`${interview.type} Round`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              />
              <Chip
                label={`Req: ${candidate?.job?.title || 'Position'}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#969DAA',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.75rem' }}>
              Interviewer: {interview.interviewer?.name || 'Assigned Staff'} • Duration: {interview.duration} mins
            </Typography>
          </Box>
        </Box>

        {/* Live Indicator + Timer + Action Button */}
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.8,
              py: 0.6,
              borderRadius: '20px',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#ef4444',
                boxShadow: '0 0 10px #ef4444',
                animation: 'pulse 1.5s infinite'
              }}
            />
            <Typography variant="caption" fontWeight={800} sx={{ color: '#ef4444', letterSpacing: '0.08em' }}>
              LIVE
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#F5F7FA', fontFamily: 'monospace', ml: 0.5 }}>
              {formatTimer(elapsedSeconds)}
            </Typography>
          </Box>

          {!isCandidateUser && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AiIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenEndInterviewModal}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderRadius: '8px',
                px: 2,
                height: 36,
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
                }
              }}
            >
              End Interview & Generate Feedback
            </Button>
          )}
        </Box>
      </Paper>

      {/* 2. SPLIT OR FULL INTERVIEW WORKSPACE LAYOUT */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 2 }}>

        {/* LEFT SIDE: INTERVIEW TRANSCRIPT & CONVERSATION (Full width for Candidate, split width for Staff) */}
        <Card
          sx={{
            flex: isCandidateUser ? 1 : 1.1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#101318',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            p: 2,
            overflow: 'hidden'
          }}
        >
          {/* Transcript Header Controls */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <QuoteIcon sx={{ color: '#818cf8', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA' }}>
                Interview Transcript & Live Dialogue Stream
              </Typography>
              <Chip
                label={`${transcriptLines.length} Messages`}
                size="small"
                sx={{ height: 18, fontSize: '0.68rem', bgcolor: 'rgba(255,255,255,0.06)', color: '#969DAA' }}
              />
            </Box>

            {!isCandidateUser && (
              <Box display="flex" alignItems="center" gap={1}>
                {/* Preset Dialogue Script Selector for Interviewer */}
                <TextField
                  select
                  size="small"
                  value={selectedScriptKey}
                  onChange={(e) => handleRunPresetScript(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    width: 170,
                    '& .MuiOutlinedInput-root': {
                      height: 28,
                      fontSize: '0.72rem',
                      bgcolor: '#0B0D10',
                      color: '#818cf8'
                    }
                  }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: '0.75rem' }}>
                    Simulate Dialogue...
                  </MenuItem>
                  <MenuItem value="system_design" sx={{ fontSize: '0.75rem' }}>
                    System Design Round
                  </MenuItem>
                  <MenuItem value="frontend_react" sx={{ fontSize: '0.75rem' }}>
                    React & Frontend Deep Dive
                  </MenuItem>
                  <MenuItem value="leadership_cultural" sx={{ fontSize: '0.75rem' }}>
                    Leadership & Behavioral
                  </MenuItem>
                </TextField>

                <Tooltip title="Paste Full Transcript Text">
                  <IconButton size="small" onClick={() => setPasteModalOpen(true)} sx={{ color: '#969DAA' }}>
                    <PasteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Clear Transcript">
                  <IconButton size="small" onClick={handleClearTranscript} sx={{ color: '#ef4444' }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />

          {/* Transcript Feed Log */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 2,
              bgcolor: '#0B0D10',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            {transcriptLines.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" color="#626975">
                <QuoteIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  No live dialogue recorded yet.
                </Typography>
                <Typography variant="caption" sx={{ color: '#474d57', mt: 0.5, textAlign: 'center' }}>
                  {isCandidateUser ? 'Type your response below or use voice input to reply to interviewer.' : 'Start typing below, use mic input, or select a simulated dialogue script above.'}
                </Typography>
              </Box>
            ) : (
              transcriptLines.map((line, idx) => {
                const isInterviewer = line.speaker === 'Interviewer';
                const isMyMessage = line.speaker === currentSpeaker;
                return (
                  <Box
                    key={line.id || idx}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMyMessage ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      alignSelf: isMyMessage ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ color: isInterviewer ? '#818cf8' : '#06b6d4', fontSize: '0.7rem' }}
                      >
                        {isInterviewer ? `Interviewer (${interview.interviewer?.name || 'Staff'})` : `Candidate (${candidate?.name || 'Candidate'})`}
                      </Typography>
                      {line.timestamp && (
                        <Typography variant="caption" sx={{ color: '#474d57', fontSize: '0.65rem' }}>
                          {line.timestamp}
                        </Typography>
                      )}
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: isMyMessage ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                        bgcolor: isMyMessage
                          ? isCandidateUser ? 'rgba(6, 182, 212, 0.15)' : 'rgba(99, 102, 241, 0.15)'
                          : isInterviewer ? 'rgba(99, 102, 241, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                        border: isMyMessage
                          ? isCandidateUser ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)'
                          : isInterviewer ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(6, 182, 212, 0.25)',
                        color: '#F5F7FA',
                        fontSize: '0.83rem',
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {line.text}
                    </Paper>
                  </Box>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </Paper>

          {/* Real-time Dialogue Input Row (Role Fixed — No Role Selection Dropdown) */}
          <Box display="flex" gap={1} mt={1.5} alignItems="center">
            <Box
              sx={{
                height: 38,
                px: isListening ? 2 : 1.5,
                py: 0.5,
                minWidth: isListening ? 115 : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 700,
                bgcolor: isListening
                  ? 'rgba(59, 130, 246, 0.18)'
                  : isCandidateUser
                  ? 'rgba(6, 182, 212, 0.15)'
                  : 'rgba(99, 102, 241, 0.15)',
                color: isListening
                  ? '#60a5fa'
                  : isCandidateUser
                  ? '#06b6d4'
                  : '#818cf8',
                border: isListening
                  ? '1px solid rgba(96, 165, 250, 0.4)'
                  : isCandidateUser
                  ? '1px solid rgba(6, 182, 212, 0.3)'
                  : '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                backdropFilter: isListening ? 'blur(10px)' : 'none',
                boxShadow: isListening ? '0 0 15px rgba(59, 130, 246, 0.35)' : 'none',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {isListening ? (
                <VoiceWaveVisualizer
                  isListening={isListening}
                  barCount={14}
                  height={20}
                  color="#60a5fa"
                />
              ) : (
                isCandidateUser ? 'Candidate' : 'Interviewer'
              )}
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder={
                isListening
                  ? "Listening... Speak into microphone"
                  : isCandidateUser
                  ? "Type response as Candidate... (Press Enter to send)"
                  : "Type message for Interviewer... (Press Enter to send)"
              }
              value={inputDialogue}
              onChange={(e) => setInputDialogue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddDialogue();
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 38,
                  fontSize: '0.82rem',
                  bgcolor: isListening ? 'rgba(59, 130, 246, 0.05)' : '#0B0D10',
                  borderColor: isListening ? '#3b82f6' : undefined,
                  boxShadow: isListening ? '0 0 10px rgba(59, 130, 246, 0.2)' : undefined,
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            />

            <Tooltip title={isListening ? 'Stop Mic Recording' : 'Start Speech Input (Mic)'}>
              <IconButton
                onClick={toggleListening}
                sx={{
                  bgcolor: isListening ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: isListening ? '#60a5fa' : '#969DAA',
                  border: isListening ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                  height: 38,
                  width: 38,
                  boxShadow: isListening ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none',
                  animation: isListening ? 'micPulse 1.5s infinite ease-in-out' : 'none',
                  '@keyframes micPulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.5)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
                  }
                }}
              >
                {isListening ? <MicOffIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              size="small"
              onClick={handleAddDialogue}
              disabled={!inputDialogue.trim()}
              sx={{
                height: 38,
                px: 2,
                bgcolor: isCandidateUser ? '#06b6d4' : '#818cf8',
                '&:hover': { bgcolor: isCandidateUser ? '#0891b2' : '#6366f1' }
              }}
            >
              <SendIcon sx={{ fontSize: 16 }} />
            </Button>
          </Box>
        </Card>

        {/* RIGHT SIDE: PANEL (Rendered ONLY for Interviewer / Recruiter / Admin) */}
        {!isCandidateUser && (
          <Card
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#101318',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              p: 2,
              overflowY: 'auto'
            }}
          >
            {interview?.type === 'TECHNICAL' ? (
              <>
                {/* AI Copilot Panel Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AiIcon sx={{ color: '#06b6d4', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.01em' }}>
                      TECHNICAL AI COPILOT INTELLIGENCE
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                {/* AI COPILOT SECTIONS */}
                <Box display="flex" flexDirection="column" gap={2}>

                  {/* A. COVERAGE TRACKER */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: '#0B0D10',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px'
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CoverageIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#F5F7FA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          JD vs Resume Skill Coverage Tracker
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.7rem' }}>
                        Job Requirements Alignment
                      </Typography>
                    </Box>

                    {copilotAnalysis?.coverage && copilotAnalysis.coverage.length > 0 ? (
                      <Grid container spacing={1} mt={0.5}>
                        {copilotAnalysis.coverage.map((item, idx) => {
                          const computedStatus = getTopicStatus(item.topic, item.status);
                          const isCovered = computedStatus === 'COVERED';
                          const isInProgress = computedStatus === 'IN_PROGRESS';
                          const isSelected = selectedTopic === item.topic;
                          const qCount = getTopicQuestionsCount(item.topic);

                          return (
                            <Grid item xs={12} key={idx}>
                              <Box
                                onClick={() => {
                                  setSelectedTopic(item.topic);
                                  handleRegenerateQuestions(item.topic);
                                }}
                                sx={{
                                  p: 1.2,
                                  px: 1.5,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  bgcolor: isSelected
                                    ? 'rgba(6, 182, 212, 0.12)'
                                    : isCovered
                                      ? 'rgba(16, 185, 129, 0.06)'
                                      : isInProgress
                                        ? 'rgba(245, 158, 11, 0.06)'
                                        : 'rgba(239, 68, 68, 0.06)',
                                  border: isSelected
                                    ? '1px solid #06b6d4'
                                    : isCovered
                                      ? '1px solid rgba(16, 185, 129, 0.2)'
                                      : isInProgress
                                        ? '1px solid rgba(245, 158, 11, 0.2)'
                                        : '1px solid rgba(239, 68, 68, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 2,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    borderColor: '#06b6d4',
                                    bgcolor: 'rgba(6, 182, 212, 0.1)'
                                  }
                                }}
                              >
                                <Box display="flex" alignItems="center" gap={1.2} sx={{ minWidth: 0, flex: 1 }}>
                                  {isCovered ? (
                                    <CheckIcon sx={{ color: '#10b981', fontSize: 18, flexShrink: 0 }} />
                                  ) : isInProgress ? (
                                    <PendingIcon sx={{ color: '#f59e0b', fontSize: 18, flexShrink: 0 }} />
                                  ) : (
                                    <WarningIcon sx={{ color: '#ef4444', fontSize: 18, flexShrink: 0 }} />
                                  )}
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '0.82rem', lineHeight: 1.2 }}>
                                      {item.topic}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: isCovered ? '#34d399' : isInProgress ? '#f59e0b' : '#ef4444', fontSize: '0.72rem', display: 'block', mt: 0.2 }}>
                                      {isCovered
                                        ? `${qCount} questions evaluated (Covered)`
                                        : isInProgress
                                          ? `${qCount}/3 questions evaluated so far`
                                          : '0/3 questions evaluated (Gap — Click topic to generate questions)'}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Chip
                                  label={computedStatus}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    bgcolor: isCovered ? '#10b981' : isInProgress ? '#f59e0b' : '#ef4444',
                                    color: '#ffffff',
                                    flexShrink: 0
                                  }}
                                />
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#626975', display: 'block', mt: 1 }}>
                        Analyzing candidate resume against JD technical requirements...
                      </Typography>
                    )}
                  </Paper>

                  {/* B. DYNAMIC SUGGESTED TECHNICAL FOLLOW-UP QUESTIONS */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: '#0B0D10',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px'
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} flexWrap="wrap" gap={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <IdeaIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#F5F7FA', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.75rem' }}>
                          Technical Questions {selectedTopic ? `(${selectedTopic})` : '(JD & Resume Matched)'}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={regeneratingQuestions ? <CircularProgress size={12} color="inherit" /> : <RefreshIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleRegenerateQuestions(selectedTopic || undefined)}
                        disabled={regeneratingQuestions}
                        sx={{
                          color: '#f59e0b',
                          borderColor: 'rgba(245, 158, 11, 0.4)',
                          fontSize: '0.72rem',
                          py: 0.3,
                          px: 1.2,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: '6px',
                          '&:hover': {
                            borderColor: '#f59e0b',
                            bgcolor: 'rgba(245, 158, 11, 0.1)'
                          }
                        }}
                      >
                        {regeneratingQuestions ? 'Generating...' : 'Regenerate Questions'}
                      </Button>
                    </Box>

                    {(() => {
                      const availableQuestions = (copilotAnalysis?.suggestedQuestions || []).filter(
                        (q) => !usedQuestionTexts.includes(q.question)
                      );

                      return availableQuestions.length > 0 ? (
                        <Box display="flex" flexDirection="column" gap={1.2} mt={1}>
                          {availableQuestions.map((q, idx) => (
                            <Paper
                              key={idx}
                              elevation={0}
                              sx={{
                                p: 1.5,
                                bgcolor: '#101318',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '6px'
                              }}
                            >
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={0.8}>
                                <Chip
                                  label={q.category}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: 'rgba(99, 102, 241, 0.15)',
                                    color: '#818cf8',
                                    border: '1px solid rgba(99, 102, 241, 0.3)'
                                  }}
                                />
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setUsedQuestionTexts((prev) => [...prev, q.question]);
                                    setInputDialogue(q.question);
                                  }}
                                  sx={{ fontSize: '0.68rem', py: 0.2, px: 1, color: '#06b6d4', fontWeight: 700 }}
                                >
                                  Use Question
                                </Button>
                              </Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#F5F7FA', fontSize: '0.8rem', mb: 0.5 }}>
                                "{q.question}"
                              </Typography>
                              {q.reasoning && (
                                <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.7rem', display: 'block' }}>
                                  Rationale: {q.reasoning}
                                </Typography>
                              )}
                            </Paper>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#626975', display: 'block', mt: 1 }}>
                          {copilotAnalysis?.suggestedQuestions && copilotAnalysis.suggestedQuestions.length > 0
                            ? 'All current questions used for this round! Click "Regenerate Questions" above or select another topic.'
                            : 'Generating deep-dive technical questions...'}
                        </Typography>
                      );
                    })()}
                  </Paper>

                  {/* C. RESUME INSIGHTS & CONTEXT */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: '#0B0D10',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PersonIcon sx={{ color: '#818cf8', fontSize: 16 }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#F5F7FA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Candidate Resume vs JD Technical Insights
                      </Typography>
                    </Box>

                    <Box display="flex" gap={1} flexWrap="wrap" mb={1.2}>
                      <Chip label={`${candidate?.experienceYears ?? 0} Yrs Exp`} size="small" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.05)', color: '#969DAA' }} />
                      <Chip label={`Skills: ${candidate?.skills ? candidate.skills.slice(0, 45) : 'General'}...`} size="small" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.05)', color: '#969DAA' }} />
                    </Box>

                    {copilotAnalysis?.resumeInsights && copilotAnalysis.resumeInsights.length > 0 ? (
                      <Box display="flex" flexDirection="column" gap={0.8}>
                        {copilotAnalysis.resumeInsights.map((insight, idx) => (
                          <Typography key={idx} variant="body2" sx={{ color: '#969DAA', fontSize: '0.75rem', lineHeight: 1.4 }}>
                            • {insight}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#626975', display: 'block' }}>
                        Loading resume cross-match insights...
                      </Typography>
                    )}
                  </Paper>
                </Box>
              </>
            ) : (
              /* NON-TECHNICAL ROUNDS: STATIC QUESTION BANK (HR, MANAGERIAL, CULTURAL) */
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SignalIcon sx={{ color: '#818cf8', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.01em' }}>
                      {interview?.type} ROUND EVALUATION GUIDE
                    </Typography>
                  </Box>
                  <Chip
                    label={`${interview?.type} QUESTION BANK`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(129, 140, 248, 0.15)',
                      color: '#818cf8',
                      border: '1px solid rgba(129, 140, 248, 0.3)'
                    }}
                  />
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                <Box display="flex" flexDirection="column" gap={1.8}>
                  <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.75rem', lineHeight: 1.4 }}>
                    Standardized interview evaluation prompts for the <strong>{interview?.type}</strong> round. Select any prompt below to insert directly into your live dialogue stream:
                  </Typography>

                  {(interview?.type === 'HR'
                    ? HR_QUESTION_BANK
                    : interview?.type === 'MANAGERIAL'
                      ? MANAGERIAL_QUESTION_BANK
                      : CULTURAL_QUESTION_BANK
                  ).map((item, idx) => (
                    <Paper
                      key={idx}
                      elevation={0}
                      sx={{
                        p: 1.8,
                        bgcolor: '#0B0D10',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px'
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: 'rgba(6, 182, 212, 0.15)',
                            color: '#06b6d4',
                            border: '1px solid rgba(6, 182, 212, 0.3)'
                          }}
                        />
                        <Button
                          size="small"
                          onClick={() => setInputDialogue(item.question)}
                          sx={{ fontSize: '0.7rem', py: 0.2, px: 1, color: '#818cf8', fontWeight: 700 }}
                        >
                          Use Question
                        </Button>
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#F5F7FA', fontSize: '0.83rem', mb: 0.8, lineHeight: 1.5 }}>
                        "{item.question}"
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem', display: 'block', fontStyle: 'italic' }}>
                        Objective: {item.reasoning}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </>
            )}
          </Card>
        )}
      </Box>

      {/* PASTE TRANSCRIPT MODAL */}
      <Dialog open={pasteModalOpen} onClose={() => setPasteModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B0D10', color: '#F5F7FA', fontWeight: 700 }}>
          Paste Full Interview Transcript
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0B0D10', pt: 1 }}>
          <Typography variant="caption" sx={{ color: '#969DAA', mb: 1.5, display: 'block' }}>
            Paste existing dialogue text. Prefix lines with "Interviewer:" or "Candidate:" for speaker auto-detection.
          </Typography>
          <TextField
            multiline
            rows={8}
            fullWidth
            value={rawPasteText}
            onChange={(e) => setRawPasteText(e.target.value)}
            placeholder={`Interviewer: Welcome to the session!\nCandidate: Thank you, excited to discuss my experience.`}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#101318',
                fontSize: '0.8rem'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0B0D10', p: 2 }}>
          <Button onClick={() => setPasteModalOpen(false)} sx={{ color: '#969DAA' }}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyPasteTranscript} sx={{ bgcolor: '#818cf8' }}>
            Import Transcript
          </Button>
        </DialogActions>
      </Dialog>

      {/* END INTERVIEW & FEEDBACK DRAFT MODAL */}
      <Dialog open={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B0D10', color: '#F5F7FA', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AiIcon sx={{ color: '#06b6d4' }} />
          AI Interview Summary & Feedback Scorecard Draft
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0B0D10', pt: 1 }}>
          {generatingDraft ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={2}>
              <CircularProgress size={36} sx={{ color: '#06b6d4' }} />
              <Typography variant="body2" sx={{ color: '#969DAA' }}>
                Synthesizing transcript & generating AI feedback draft...
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>

              {/* Executive Summary Box */}
              {feedbackDraft?.summary && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px' }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5, display: 'block' }}>
                    AI Executive Interview Summary
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#F5F7FA', fontSize: '0.83rem', lineHeight: 1.5 }}>
                    {feedbackDraft.summary}
                  </Typography>
                </Paper>
              )}

              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA', mt: 1 }}>
                Review & Edit Scorecard Ratings (1 - 10)
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 0.5 }}>
                    Technical Rating ({technicalRating}/10)
                  </Typography>
                  <Rating max={10} value={technicalRating} onChange={(_, val) => setTechnicalRating(val || 1)} size="small" sx={{ color: '#818cf8' }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 0.5 }}>
                    Communication Rating ({communicationRating}/10)
                  </Typography>
                  <Rating max={10} value={communicationRating} onChange={(_, val) => setCommunicationRating(val || 1)} size="small" sx={{ color: '#818cf8' }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 0.5 }}>
                    Problem Solving Rating ({problemSolvingRating}/10)
                  </Typography>
                  <Rating max={10} value={problemSolvingRating} onChange={(_, val) => setProblemSolvingRating(val || 1)} size="small" sx={{ color: '#818cf8' }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 0.5 }}>
                    Culture Fit Rating ({cultureFitRating}/10)
                  </Typography>
                  <Rating max={10} value={cultureFitRating} onChange={(_, val) => setCultureFitRating(val || 1)} size="small" sx={{ color: '#818cf8' }} />
                </Grid>
              </Grid>

              <TextField
                label="Verified Strengths"
                multiline
                rows={2}
                fullWidth
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#101318', fontSize: '0.8rem' } }}
              />

              <TextField
                label="Identified Risk Areas / Weaknesses"
                multiline
                rows={2}
                fullWidth
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#101318', fontSize: '0.8rem' } }}
              />

              <TextField
                label="Interviewer Qualitative Comments & Notes"
                multiline
                rows={2}
                fullWidth
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#101318', fontSize: '0.8rem' } }}
              />

              <Box>
                <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 0.8 }}>
                  Hiring Recommendation
                </Typography>
                <TextField
                  select
                  size="small"
                  fullWidth
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value as any)}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#101318', fontSize: '0.8rem' } }}
                >
                  <MenuItem value="STRONG_YES">STRONG YES - Clear Hire</MenuItem>
                  <MenuItem value="YES">YES - Recommend Hire</MenuItem>
                  <MenuItem value="MAYBE">MAYBE - Needs Further Evaluation</MenuItem>
                  <MenuItem value="NO">NO - Do Not Pursue</MenuItem>
                  <MenuItem value="STRONG_NO">STRONG NO - Clear Rejection</MenuItem>
                </TextField>
              </Box>

            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0B0D10', p: 2.5 }}>
          <Button onClick={() => setFeedbackModalOpen(false)} sx={{ color: '#969DAA' }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={generatingDraft || submittingFeedback}
            onClick={handleSubmitFeedback}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              fontWeight: 700,
              px: 3
            }}
          >
            {submittingFeedback ? 'Submitting...' : 'Submit Final Feedback Scorecard'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewWorkspace;
