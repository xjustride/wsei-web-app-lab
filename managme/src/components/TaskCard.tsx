import React from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip, Button, Stack, Avatar, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import { motion } from 'framer-motion';
import { Task, TaskStatus } from '@/models/Task';
import { Priority } from '@/models/Story';
import { userService } from '@/services/UserService';
import { storyService } from '@/services/StoryService';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onClick, onStatusChange }: TaskCardProps) {
  const theme = useTheme();
  
  const priorityColors = {
    [Priority.LOW]: 'success',
    [Priority.MEDIUM]: 'primary',
    [Priority.HIGH]: 'error'
  };

  const statusColors = {
    [TaskStatus.TODO]: 'secondary',
    [TaskStatus.DOING]: 'warning',
    [TaskStatus.DONE]: 'success'
  };

  const assignee = task.assigneeId 
    ? userService.getAllUsers().find(user => user.id === task.assigneeId)
    : null;
    
  const story = task.storyId
    ? storyService.getStoryById(task.storyId)
    : null;

  const handleStatusChange = (e: React.MouseEvent<HTMLButtonElement>, newStatus: TaskStatus) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  const getBackgroundColor = () => {
    if (theme.palette.mode === 'dark') {
      return task.status === TaskStatus.DONE 
        ? 'rgba(66, 189, 86, 0.1)'
        : task.status === TaskStatus.DOING
          ? 'rgba(255, 152, 0, 0.1)'
          : 'transparent';
    } else {
      return task.status === TaskStatus.DONE 
        ? 'rgba(66, 189, 86, 0.05)'
        : task.status === TaskStatus.DOING
          ? 'rgba(255, 152, 0, 0.05)'
          : 'transparent';
    }
  };

  const renderStatusButtons = () => {
    if (!onStatusChange) return null;

    return (
      <Stack direction="row" spacing={1} mt={1.5}>
        {task.status === TaskStatus.TODO && !task.assigneeId && (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<PlayArrowIcon />}
            onClick={(e) => onClick()} // Go to details to assign user first
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
        
        {task.status === TaskStatus.TODO && task.assigneeId && (
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
        
        {task.status === TaskStatus.DOING && (
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={(e) => onClick()} 
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
    );
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 3px 5px rgba(0, 0, 0, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.14)',
          backgroundColor: getBackgroundColor(),
          borderLeft: '4px solid',
          borderColor: `${theme.palette[statusColors[task.status] as 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'].main}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': { 
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 5px 15px rgba(0, 0, 0, 0.4)'
              : '0 4px 8px rgba(0, 0, 0, 0.15)'
          }
        }}
        onClick={onClick}
      >
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
            </Typography>
            <Box>
              <Tooltip title="Edytuj">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Usuń">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
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
              <Chip 
                label={task.priority} 
                size="small" 
                color={priorityColors[task.priority] as any}
                sx={{ borderRadius: 4 }}
              />
              <Chip 
                size="small"
                icon={<AccessTimeIcon sx={{ fontSize: '0.85rem !important' }} />}
                label={`${task.estimatedHours}h`}
                variant="outlined"
                sx={{ borderRadius: 4 }}
              />
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
      </Card>
    </motion.div>
  );
}
