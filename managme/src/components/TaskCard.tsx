import React from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip, Button, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion } from 'framer-motion';
import { Task, TaskStatus } from '@/models/Task';
import { Priority } from '@/models/Story';
import { userService } from '@/services/UserService';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onClick, onStatusChange }: TaskCardProps) {
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

  const handleStatusChange = (e: React.MouseEvent<HTMLButtonElement>, newStatus: TaskStatus) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  const renderStatusButtons = () => {
    if (!onStatusChange) return null;

    return (
      <Stack direction="row" spacing={1} mt={1}>
        {task.status === TaskStatus.TODO && !task.assigneeId && (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<PlayArrowIcon />}
            onClick={(e) => onClick()} // Go to details to assign user first
            sx={{ fontSize: '0.75rem' }}
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
            sx={{ fontSize: '0.75rem' }}
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
            onClick={(e) => onClick()} // Go to details for completion with logged hours
            sx={{ fontSize: '0.75rem' }}
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
          '&:hover': { boxShadow: 3 }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium" noWrap sx={{ maxWidth: '70%' }}>
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
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
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
            }}
          >
            {task.description}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Chip 
                label={task.priority} 
                size="small" 
                color={priorityColors[task.priority] as any}
              />
              <Chip 
                size="small"
                icon={<AccessTimeIcon />}
                label={`${task.estimatedHours}h`}
                variant="outlined"
              />
            </Box>
            
            {assignee && (
              <Tooltip title={`Przypisano: ${assignee.firstName} ${assignee.lastName}`}>
                <Chip 
                  label={`${assignee.firstName.charAt(0)}${assignee.lastName.charAt(0)}`} 
                  size="small" 
                  color="primary"
                />
              </Tooltip>
            )}
          </Box>
          
          {renderStatusButtons()}
        </CardContent>
      </Card>
    </motion.div>
  );
}
