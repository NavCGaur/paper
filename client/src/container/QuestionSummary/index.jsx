import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  IconButton,
  Box,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const QuestionSummaryDashboard = () => {
  // Sample data structure - replace with your actual data
  const { data = [] } = {
    data: [
      {
        _id: { class: "10th", subject: "Math", chapter: "Algebra" },
        questionTypes: [
          { type: "MCQ", count: 25 },
          { type: "Short", count: 15 }
        ]
      },
      {
        _id: { class: "10th", subject: "Math", chapter: "Geometry" },
        questionTypes: [
          { type: "MCQ", count: 20 },
          { type: "Long", count: 10 }
        ]
      }
    ]
  };

  const [groupBy, setGroupBy] = useState("class");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Extract unique values for filters
  const classes = [...new Set(data.map(item => item._id.class))];
  const subjects = [...new Set(data.map(item => item._id.subject))];

  // Process and group data
  const processedData = useMemo(() => {
    let filteredData = data;
    
    if (filterClass !== "all") {
      filteredData = filteredData.filter(item => item._id.class === filterClass);
    }
    if (filterSubject !== "all") {
      filteredData = filteredData.filter(item => item._id.subject === filterSubject);
    }

    const grouped = filteredData.reduce((acc, item) => {
      const groupKey = item._id[groupBy];
      if (!acc[groupKey]) {
        acc[groupKey] = {
          items: [],
          totalCount: 0,
          typeBreakdown: {}
        };
      }
      
      acc[groupKey].items.push(item);
      item.questionTypes.forEach(q => {
        acc[groupKey].totalCount += q.count;
        acc[groupKey].typeBreakdown[q.type] = (acc[groupKey].typeBreakdown[q.type] || 0) + q.count;
      });
      
      return acc;
    }, {});

    return grouped;
  }, [data, groupBy, filterClass, filterSubject]);

  const toggleGroup = (group) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const getChartData = (typeBreakdown) => {
    return {
      labels: Object.keys(typeBreakdown),
      datasets: [
        {
          label: 'Number of Questions',
          data: Object.values(typeBreakdown),
          backgroundColor: 'rgba(63, 81, 181, 0.6)',
          borderColor: 'rgba(63, 81, 181, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Question Type Distribution',
      },
    },
  };

  return (
    <Box sx={{ p: 4 }}>
      <Card>
        <CardHeader
          title="Question Summary Dashboard"
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  label="Class"
                >
                  <MenuItem value="all">All Classes</MenuItem>
                  {classes.map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  label="Subject"
                >
                  <MenuItem value="all">All Subjects</MenuItem>
                  {subjects.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Group By</InputLabel>
                <Select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  label="Group By"
                >
                  <MenuItem value="class">Class</MenuItem>
                  <MenuItem value="subject">Subject</MenuItem>
                  <MenuItem value="chapter">Chapter</MenuItem>
                </Select>
              </FormControl>
            </Box>
          }
        />
        <CardContent>
          {Object.entries(processedData).map(([group, data]) => (
            <Card key={group} sx={{ mb: 2, p: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => toggleGroup(group)}
              >
                <IconButton size="small">
                  {expandedGroups.has(group) ? 
                    <ExpandMoreIcon /> : 
                    <ChevronRightIcon />
                  }
                </IconButton>
                <Typography variant="h6" component="div">
                  {group}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  ({data.totalCount} questions)
                </Typography>
              </Box>

              {expandedGroups.has(group) && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ height: 300, mb: 2 }}>
                    <Bar 
                      data={getChartData(data.typeBreakdown)} 
                      options={chartOptions}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    {data.items.map((item, idx) => (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {item._id.chapter}
                          </Typography>
                          {item.questionTypes.map((q, qIdx) => (
                            <Box 
                              key={qIdx} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                mt: 1 
                              }}
                            >
                              <Typography variant="body2">{q.type}:</Typography>
                              <Typography variant="body2">{q.count}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuestionSummaryDashboard;