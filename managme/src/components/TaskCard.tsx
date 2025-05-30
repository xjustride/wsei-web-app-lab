import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip, Button, Stack, Avatar, useTheme, ButtonGroup, Popover } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { motion } from 'framer-motion';
import { Task, TaskStatus } from '@/models/Task';
import { Priority } from '@/models/Story';
import { User } from '@/models/User';
import { userService } from '@/services/UserService';
import { storyService } from '@/services/StoryService';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  isGuest: boolean;
  isFocused?: boolean;
}

export default function TaskCard({ task, onEdit, onDelete, onClick, onStatusChange, isGuest, isFocused = false }: TaskCardProps) {
  const theme = useTheme();
  const [story, setStory] = useState<any>(null);
  const [assignee, setAssignee] = useState<User | null>(null);
  const [tooltipAnchorEl, setTooltipAnchorEl] = useState<HTMLElement | null>(null);
  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (task.story) {
      storyService.getStoryById(task.story).then(setStory);
    }
  }, [task.story]);

  useEffect(() => {
    const loadAssignee = async () => {
      if (task.assignedTo) {
        const users = await userService.getAllUsers();
        const user = users.find(user => user.id === task.assignedTo);
        setAssignee(user || null);
      }
    };
    loadAssignee();
  }, [task.assignedTo]);
  
  const priorityColors = {
    [Priority.LOW]: 'success',
    [Priority.MEDIUM]: 'primary',
    [Priority.HIGH]: 'warning',
    [Priority.CRITICAL]: 'error'
  };

  const statusColors = {
    [TaskStatus.TODO]: 'secondary',
    [TaskStatus.DOING]: 'warning',
    [TaskStatus.DONE]: 'success'
  };

  const handleStatusChange = (e: React.MouseEvent<HTMLButtonElement>, newStatus: TaskStatus) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  const getBackgroundColor = () => {
    if (theme.palette.mode === 'dark') {
      return task.state === TaskStatus.DONE 
        ? 'rgba(66, 189, 86, 0.1)'
        : task.state === TaskStatus.DOING
          ? 'rgba(255, 152, 0, 0.1)'
          : 'transparent';
    } else {
      return task.state === TaskStatus.DONE 
        ? 'rgba(66, 189, 86, 0.05)'
        : task.state === TaskStatus.DOING
          ? 'rgba(255, 152, 0, 0.05)'
          : 'transparent';
    }
  };
  
  const getStatusColor = () => {
    switch(task.state) {
      case TaskStatus.TODO:
        return theme.palette.secondary.main;
      case TaskStatus.DOING:
        return theme.palette.warning.main;
      case TaskStatus.DONE:
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const handleTooltipOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setTooltipAnchorEl(event.currentTarget);
  };

  const handleTooltipClose = () => {
    setTooltipAnchorEl(null);
  };

  // Function to format date-time in Polish format
  const formatDate = (date: Date | undefined | string): string => {
    if (!date) return 'Brak daty';
    try {
      return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: pl });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Nieprawidłowa data';
    }
  };

  const handleInfoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setInfoAnchorEl(null);
  };
  
  const openInfo = Boolean(infoAnchorEl);
  const infoId = openInfo ? 'task-info-popover' : undefined;
  
  const totalTimeSpent = task.timeLogs?.reduce((total, log) => total + (log.timeSpent || 0), 0) || 0;
  const timeSpentHours = Math.floor(totalTimeSpent / 60);
  const timeSpentMinutes = totalTimeSpent % 60;

  const tooltipOpen = Boolean(tooltipAnchorEl);
  const tooltipId = tooltipOpen ? 'task-detail-tooltip' : undefined;

  const renderStatusButtons = () => {
    if (!onStatusChange || isGuest) return null;
    
    const getNextStatus = (currentStatus: TaskStatus): TaskStatus | null => {
      switch (currentStatus) {
        case TaskStatus.TODO:
          return TaskStatus.DOING;
        case TaskStatus.DOING:
          return TaskStatus.DONE;
        default:
          return null;
      }
    };
    
    const getPrevStatus = (currentStatus: TaskStatus): TaskStatus | null => {
      switch (currentStatus) {
        case TaskStatus.DOING:
          return TaskStatus.TODO;
        case TaskStatus.DONE:
          return TaskStatus.DOING;
        default:
          return null;
      }
    };
    
    return (
      <Box mt={1.5}>
        {/* Quick Action Buttons with Arrows */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mb={1}>
          {/* Move Back Button */}
          {getPrevStatus(task.state) && (
            <Tooltip title={`Przenieś do ${getPrevStatus(task.state) === TaskStatus.TODO ? 'Do zrobienia' : 'W trakcie'}`}>
              <IconButton
                size="small"
                color={getPrevStatus(task.state) === TaskStatus.TODO ? "secondary" : "warning"}
                onClick={(e) => handleStatusChange(e, getPrevStatus(task.state)!)}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 1
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Reset or Reopen Button for DONE tasks */}
          {task.state === TaskStatus.DONE && (
            <Tooltip title="Resetuj do 'Do zrobienia'">
              <IconButton
                size="small"
                color="secondary"
                onClick={(e) => handleStatusChange(e, TaskStatus.TODO)}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 1
                }}
              >
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Status indicator in the center */}
          <Typography 
            variant="caption" 
            sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              px: 1.5,
              py: 0.5,
              borderRadius: 4,
              fontWeight: 500
            }}
          >
            {task.state === TaskStatus.TODO ? 'Do zrobienia' : task.state === TaskStatus.DOING ? 'W trakcie' : 'Ukończone'}
          </Typography>
          
          {/* Move Forward Button */}
          {getNextStatus(task.state) && (
            <Tooltip title={`Przenieś do ${getNextStatus(task.state) === TaskStatus.DOING ? 'W trakcie' : 'Ukończone'}`}>
              <IconButton
                size="small"
                color={getNextStatus(task.state) === TaskStatus.DOING ? "warning" : "success"}
                onClick={(e) => {
                  // Special case for tasks without assignee
                  if (task.state === TaskStatus.TODO && !task.assignedTo) {
                    // Open task details to assign user first
                    e.stopPropagation();
                    onClick();
                  } else {
                    handleStatusChange(e, getNextStatus(task.state)!);
                  }
                }}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 1
                }}
              >
                {getNextStatus(task.state) === TaskStatus.DONE ? <CheckCircleIcon fontSize="small" /> : <ArrowForwardIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Traditional Buttons */}
        <Stack direction="row" spacing={1}>
          {task.state === TaskStatus.TODO && !task.assignedTo && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<PlayArrowIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              sx={{ 
                fontSize: '0.75rem',
                borderRadius: 6,
                textTransform: 'none'
              }}
              fullWidth
            >
              Przypisz i rozpocznij
            </Button>
          )}
          
          {task.state === TaskStatus.TODO && task.assignedTo && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<PlayArrowIcon />}
              onClick={(e) => handleStatusChange(e, TaskStatus.DOING)}
              sx={{ 
                fontSize: '0.75rem',
                borderRadius: 6,
                textTransform: 'none'
              }}
              fullWidth
            >
              Rozpocznij
            </Button>
          )}
          
          {task.state === TaskStatus.DOING && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={(e) => handleStatusChange(e, TaskStatus.DONE)}
              sx={{ 
                fontSize: '0.75rem',
                borderRadius: 6,
                textTransform: 'none'
              }}
              fullWidth
            >
              Zakończ
            </Button>
          )}
        </Stack>
      </Box>
    );
  };
  
  const renderTaskInfo = () => (
    <>
      <Box sx={{ position: 'absolute', top: 8, right: 45, zIndex: 1 }}>
        <IconButton
          size="small"
          aria-describedby={infoId}
          onClick={handleInfoClick}
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
            }
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Popover
        id={infoId}
        open={openInfo}
        anchorEl={infoAnchorEl}
        onClose={handleInfoClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            p: 2,
            width: 300,
            maxWidth: '95vw'
          }
        }}
      >
        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
          Szczegóły zadania
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'auto 1fr', 
          columnGap: 2, 
          rowGap: 1,
          mb: 1
        }}>
          <Typography variant="caption" color="text.secondary" fontWeight="500">ID:</Typography>
          <Typography variant="caption">{task.id.substring(0, 8)}...</Typography>
          
          {story && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight="500">Historyjka:</Typography>
              <Typography variant="caption">{story.name}</Typography>
            </>
          )}
          
          <Typography variant="caption" color="text.secondary" fontWeight="500">Priorytet:</Typography>
          <Typography variant="caption">
            <Chip 
              size="small" 
              label={
                task.priority === Priority.LOW ? 'Niski' :
                task.priority === Priority.MEDIUM ? 'Średni' :
                task.priority === Priority.HIGH ? 'Wysoki' : 'Krytyczny'
              } 
              color={priorityColors[task.priority] as any}
            />
          </Typography>
          
          <Typography variant="caption" color="text.secondary" fontWeight="500">Czas:</Typography>
          <Typography variant="caption">{task.estimatedTime}h szacowany</Typography>
          
          {totalTimeSpent > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight="500">Spędzony:</Typography>
              <Typography variant="caption">{timeSpentHours}h {timeSpentMinutes}m</Typography>
            </>
          )}
          
          {assignee && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight="500">Przypisane do:</Typography>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>
                  {assignee.firstName.charAt(0)}{assignee.lastName.charAt(0)}
                </Avatar>
                {assignee.firstName} {assignee.lastName}
              </Typography>
            </>
          )}
          
          {task.startDate && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight="500">Rozpoczęte:</Typography>
              <Typography variant="caption">{formatDate(task.startDate)}</Typography>
            </>
          )}
          
          {task.endDate && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight="500">Zakończone:</Typography>
              <Typography variant="caption">{formatDate(task.endDate)}</Typography>
            </>
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary" fontWeight="500">Opis:</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {task.description || 'Brak opisu'}
        </Typography>
      </Popover>
    </>
  );
  
  // Scroll focused task into view
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isFocused]);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={isFocused ? { scale: 1.03 } : { scale: 1 }}
      animate={isFocused ? { 
        scale: 1.03,
        transition: { duration: 0.2 }
      } : { 
        scale: 1,
        transition: { duration: 0.2 }  
      }}
    >
      <Card 
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          borderRadius: 2,
          boxShadow: isFocused
            ? `0 0 0 2px ${theme.palette.primary.main}, 0 4px 12px rgba(0, 0, 0, 0.3)`
            : theme.palette.mode === 'dark' 
              ? '0 3px 5px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.14)',
          backgroundColor: isFocused 
            ? theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)'
            : getBackgroundColor(),
          borderLeft: '4px solid',
          borderColor: isFocused ? theme.palette.primary.main : getStatusColor(),
          position: 'relative',
          overflow: 'visible',
          outline: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '10px',
            left: '-8px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isFocused ? theme.palette.primary.main : getStatusColor(),
            boxShadow: `0 0 0 3px ${theme.palette.background.paper}`,
            zIndex: 1
          },
          transition: 'all 0.2s ease-in-out',
          '&:hover': { 
            boxShadow: isFocused
              ? `0 0 0 2px ${theme.palette.primary.main}, 0 5px 15px rgba(0, 0, 0, 0.3)`
              : theme.palette.mode === 'dark' 
                ? '0 5px 15px rgba(0, 0, 0, 0.4)'
                : '0 4px 8px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)'
          }
        }}
        onClick={onClick}
        ref={cardRef}
        tabIndex={isFocused ? 0 : -1} // Make focused card keyboard-navigable
      >
        {/* Task Info Tooltip */}
        {renderTaskInfo()}
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="600" 
              noWrap 
              sx={{ 
                maxWidth: '70%',
                color: theme.palette.text.primary
              }}
            >
              {task.name}
              {isFocused && (
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-block', 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.main,
                    ml: 1,
                    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
                  }} 
                />
              )}
            </Typography>
            <Box>
              <Tooltip title="Edytuj">
                <IconButton 
                  size="small" 
                  disabled={isGuest}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isGuest) onEdit();
                  }}
                  sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Usuń">
                <IconButton 
                  size="small" 
                  disabled={isGuest}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isGuest) onDelete();
                  }}
                  sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {story && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mb: 1,
                color: theme.palette.text.secondary,
                fontStyle: 'italic'
              }}
            >
              Historyjka: {story.name}
            </Typography>
          )}
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.4em',
              height: '2.8em'
            }}
          >
            {task.description}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Chip 
                  label={task.priority} 
                  size="small" 
                  color={priorityColors[task.priority] as any}
                  sx={{ borderRadius: 4 }}
                />
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Chip 
                  size="small"
                  icon={<AccessTimeIcon sx={{ fontSize: '0.85rem !important' }} />}
                  label={`${task.estimatedTime}h`}
                  variant="outlined"
                  sx={{ borderRadius: 4 }}
                />
              </motion.div>
            </Box>
            
            {assignee && (
              <Tooltip title={`Przypisano: ${assignee.firstName} ${assignee.lastName}`}>
                <Avatar 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    fontSize: '0.8rem', 
                    bgcolor: 'primary.main',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {assignee.firstName.charAt(0)}{assignee.lastName.charAt(0)}
                </Avatar>
              </Tooltip>
            )}
          </Box>
          
          {renderStatusButtons()}
        </CardContent>
        
        {/* Tooltip for detailed task information */}
        <Popover
          id={tooltipId}
          open={tooltipOpen}
          anchorEl={tooltipAnchorEl}
          onClose={handleTooltipClose}
          disableRestoreFocus
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          sx={{ 
            pointerEvents: 'none',
            '& .MuiPaper-root': {
              p: 2,
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 8px rgba(0, 0, 0, 0.4)'
                : '0 2px 4px rgba(0, 0, 0, 0.2)',
              bgcolor: theme.palette.background.paper,
              border: '1px solid',
              borderColor: theme.palette.divider
            }
          }}
        >
          <Typography variant="subtitle2" fontWeight="500" gutterBottom>
            Szczegóły zadania
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Opis:</strong> {task.description || 'Brak opisu'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Priorytet:</strong> {task.priority}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Szacowany czas:</strong> {task.estimatedTime} godz.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Data utworzenia:</strong> {formatDate(task.createdAt)}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Ostatnia modyfikacja:</strong> {formatDate(task.updatedAt)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Czas spędzony:</strong> {timeSpentHours} godz. {timeSpentMinutes} min
          </Typography>
        </Popover>
      </Card>
    </motion.div>
  );
}
