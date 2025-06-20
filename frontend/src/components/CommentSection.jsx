import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider
} from '@mui/material';

export default function CommentSection({ comments = [], onAddComment, isLoading }) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onAddComment(newComment);
    setNewComment('');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Admin Comments
      </Typography>
      
      {/* Comment List */}
      <Box mb={3}>
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <Paper
              key={comment._id || index}
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.200'
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {comment.createdBy?.name || 'Admin'} • {format(new Date(comment.createdAt), 'PPpp')}
              </Typography>
              <Typography variant="body1">
                {comment.text}
              </Typography>
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">
            No comments yet
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          variant="outlined"
          disabled={isLoading}
        />
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!newComment.trim() || isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Comment'}
          </Button>
        </Box>
      </form>
    </Box>
  );
} 