import React from 'react';
import { useFetchQuestionSummaryQuery } from '../../state/api';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import './index.css'; // Custom styles

const QuestionSummary = () => {
  const { data, isLoading, error } = useFetchQuestionSummaryQuery();

  if (isLoading) return <p>Loading question summary...</p>;
  if (error) return <p>Error fetching data</p>;

  return (
    <div className="summary-container">
      <Typography variant="h5" className="summary-title">Question Summary</Typography>
      <TableContainer component={Paper} className="summary-table">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Chapter</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((item) =>
              item.questionTypes.map((q) => (
                <TableRow key={`${item._id.class}-${item._id.subject}-${item._id.chapter}-${q.type}`}>
                  <TableCell>{item._id.class}</TableCell>
                  <TableCell>{item._id.subject}</TableCell>
                  <TableCell>{item._id.chapter}</TableCell>
                  <TableCell>{q.type}</TableCell>
                  <TableCell>{q.count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default QuestionSummary;
