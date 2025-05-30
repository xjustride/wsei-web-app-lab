import React, { useEffect } from 'react';
import { Typography, Box, Paper, Grid, useTheme } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';

interface KeyboardShortcut {
  keys: string[];
  description: string;
}

interface ShortcutsProps {
  onKeyPress: (key: string, ctrlKey: boolean) => void;
  showHelp: boolean;
  onClose: () => void;
}

export default function Shortcuts({ onKeyPress, showHelp, onClose }: ShortcutsProps) {
  const theme = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignoruj naciśnięcia klawiszy w polach tekstowych itp.
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }
  
      // Obsługa skrótów klawiaturowych
      if (event.key === '?' && event.shiftKey) {
        // Pokaż/ukryj pomoc dla skrótów
        event.preventDefault();
        return;
      }
      
      // Przekazanie informacji o naciśnięciu klawisza do komponentu nadrzędnego
      onKeyPress(event.key, event.ctrlKey);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onKeyPress]);

  // Lista skrótów klawiaturowych
  const shortcuts: KeyboardShortcut[] = [
    // Navigacja
    { keys: ['?'], description: 'Pokaż/ukryj pomoc' },
    { keys: ['T'], description: 'Przełącz na widok Tablicy zadań' },
    { keys: ['S'], description: 'Przełącz na widok Historyjek' },
    { keys: ['P'], description: 'Przełącz na widok Projektów' },
    { keys: ['Esc'], description: 'Anuluj/zamknij' },
    
    // Akcje
    { keys: ['+', 'N'], description: 'Nowe zadanie/historyjka/projekt (zależnie od aktywnego widoku)' },
    { keys: ['R'], description: 'Odśwież dane' },
    { keys: ['Ctrl', 'S'], description: 'Zapisz (w formularzach)' },
    
    // Filtrowanie i sortowanie
    { keys: ['F'], description: 'Pokaż/ukryj filtry zadań' },
    { keys: ['/', 'Ctrl', 'F'], description: 'Szukaj zadań (focus na pole wyszukiwania)' },
    { keys: ['1'], description: 'Filtruj: tylko niski priorytet' },
    { keys: ['2'], description: 'Filtruj: tylko średni priorytet' },
    { keys: ['3'], description: 'Filtruj: tylko wysoki priorytet' },
    { keys: ['4'], description: 'Filtruj: tylko krytyczny priorytet' },
    { keys: ['0'], description: 'Wyczyść filtry' },
    
    // Nawigacja między zadaniami
    { keys: ['←', '→', '↑', '↓'], description: 'Nawigacja między zadaniami' },
    { keys: ['Enter'], description: 'Otwórz zaznaczone zadanie' },
    { keys: ['D'], description: 'Przesuń zadanie do kolumny "W trakcie"' },
    { keys: ['C'], description: 'Przesuń zadanie do kolumny "Ukończone"' },
    { keys: ['B'], description: 'Przesuń zadanie do poprzedniej kolumny' }
  ];

  if (!showHelp) return null;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Paper
        elevation={5}
        onClick={(e) => e.stopPropagation()}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '90%',
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
          <KeyboardIcon color="primary" />
          <Typography variant="h5" component="h2">
            Skróty klawiaturowe
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {shortcuts.map((shortcut, index) => (
            <Grid item xs={12} key={index}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  {shortcut.keys.map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          border: `1px solid ${theme.palette.divider}`,
                          color: theme.palette.text.primary,
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          minWidth: '24px',
                          textAlign: 'center',
                        }}
                      >
                        {key}
                      </Box>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <Box component="span" sx={{ mx: 0.5 }}>
                          {key === 'Ctrl' ? ' + ' : ' / '}
                        </Box>
                      )}
                    </React.Fragment>
                  ))}
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {shortcut.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Naciśnij Esc lub kliknij poza oknem, aby zamknąć
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
