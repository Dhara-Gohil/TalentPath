import React from 'react';
import { Box, Typography } from '@mui/material';

const parseInlineFormatting = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} style={{ color: '#F5F7FA', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} style={{ color: '#818cf8' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

export const renderFormattedText = (text: string) => {
  if (!text) return <Typography variant="caption" color="#626975" fontStyle="italic">No description provided yet...</Typography>;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<Box key={idx} sx={{ height: 6 }} />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <Typography key={idx} variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA', mt: 1.5, mb: 0.5 }}>
          {parseInlineFormatting(trimmed.replace('### ', ''))}
        </Typography>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <Typography key={idx} variant="subtitle1" fontWeight={700} sx={{ color: '#818cf8', mt: 2, mb: 0.5 }}>
          {parseInlineFormatting(trimmed.replace('## ', ''))}
        </Typography>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <Typography key={idx} variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', mt: 2, mb: 0.5 }}>
          {parseInlineFormatting(trimmed.replace('# ', ''))}
        </Typography>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <Box key={idx} display="flex" alignItems="flex-start" gap={1} sx={{ ml: 1, my: 0.3 }}>
          <Typography variant="body2" sx={{ color: '#818cf8', lineHeight: 1.5, fontWeight: 700 }}>•</Typography>
          <Typography variant="body2" sx={{ color: '#969DAA', lineHeight: 1.5, fontSize: '0.82rem' }}>
            {parseInlineFormatting(trimmed.replace(/^[*|-]\s+/, ''))}
          </Typography>
        </Box>
      );
    } else {
      elements.push(
        <Typography key={idx} variant="body2" sx={{ color: '#969DAA', lineHeight: 1.6, fontSize: '0.82rem', mb: 0.5 }}>
          {parseInlineFormatting(line)}
        </Typography>
      );
    }
  });

  return <Box>{elements}</Box>;
};

export const formatRecommendationLabel = (rec?: string): string => {
  if (!rec) return '';
  switch (rec.toUpperCase()) {
    case 'STRONG_YES':
      return 'Strong Hire';
    case 'YES':
      return 'Hire';
    case 'MAYBE':
      return 'Need More Evaluation';
    case 'NO':
      return 'Do Not Hire';
    case 'STRONG_NO':
      return 'Strong Reject';
    default:
      return rec;
  }
};
