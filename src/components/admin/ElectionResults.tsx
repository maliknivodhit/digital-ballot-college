import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Trophy, Users, Vote, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Election {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Candidate {
  id: string;
  position: string;
  user_id?: string;
  party_name: string;
  manifesto: string;
  full_name: string;
  department: string;
}

interface VoteResult {
  candidate_id: string;
  candidate_name: string;
  department: string;
  party_name: string;
  position: string;
  vote_count: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ElectionResults = () => {
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error("Error fetching elections:", error);
      toast({
        title: "Error",
        description: "Failed to fetch elections",
        variant: "destructive",
      });
    }
  };

  const fetchElectionResults = async (electionId: string) => {
    setLoading(true);
    try {
      // Get all candidates for this election
      const { data: candidates, error: candidatesError } = await supabase
        .from("candidates")
        .select("*")
        .eq("election_id", electionId)
        .eq("is_approved", true);

      if (candidatesError) throw candidatesError;

      // Get vote counts for each candidate
      const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("candidate_id")
        .eq("election_id", electionId);

      if (votesError) throw votesError;

      // Count votes per candidate
      const voteCounts: { [key: string]: number } = {};
      votes?.forEach((vote) => {
        voteCounts[vote.candidate_id] = (voteCounts[vote.candidate_id] || 0) + 1;
      });

      const totalVoteCount = votes?.length || 0;
      setTotalVotes(totalVoteCount);

      // Prepare results data
      const resultsData: VoteResult[] = (candidates || []).map((candidate) => {
        const voteCount = voteCounts[candidate.id] || 0;
        const percentage = totalVoteCount > 0 ? (voteCount / totalVoteCount) * 100 : 0;

        return {
          candidate_id: candidate.id,
          candidate_name: candidate.full_name || "Unknown",
          department: candidate.department || "Unknown",
          party_name: candidate.party_name,
          position: candidate.position,
          vote_count: voteCount,
          percentage: Math.round(percentage * 100) / 100,
        };
      });

      // Sort by vote count (highest first)
      resultsData.sort((a, b) => b.vote_count - a.vote_count);
      setResults(resultsData);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        title: "Error",
        description: "Failed to fetch election results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleElectionSelect = (electionId: string) => {
    setSelectedElection(electionId);
    fetchElectionResults(electionId);
  };

  const downloadResults = () => {
    if (!selectedElection || results.length === 0) return;

    const selectedElectionData = elections.find(e => e.id === selectedElection);
    const csvContent = [
      ['Election Results Report'],
      ['Election:', selectedElectionData?.title || 'Unknown'],
      ['Total Votes:', totalVotes.toString()],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Rank', 'Candidate Name', 'Department', 'Party', 'Position', 'Votes', 'Percentage'],
      ...results.map((result, index) => [
        (index + 1).toString(),
        result.candidate_name,
        result.department,
        result.party_name,
        result.position,
        result.vote_count.toString(),
        `${result.percentage}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `election-results-${selectedElectionData?.title?.replace(/\s+/g, '-') || 'results'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Election Results</h2>
          <p className="text-muted-foreground">View and analyze voting results</p>
        </div>
        {results.length > 0 && (
          <Button onClick={downloadResults} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Election</CardTitle>
          <CardDescription>Choose an election to view results</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedElection} onValueChange={handleElectionSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select an election to view results" />
            </SelectTrigger>
            <SelectContent>
              {elections.map((election) => (
                <SelectItem key={election.id} value={election.id}>
                  {election.title} - {new Date(election.start_time).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading results...</span>
          </CardContent>
        </Card>
      )}

      {!loading && selectedElection && results.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No votes yet</h3>
            <p className="text-muted-foreground">This election hasn't received any votes yet.</p>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVotes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leading Candidate</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results[0]?.candidate_name}</div>
                <p className="text-xs text-muted-foreground">
                  {results[0]?.vote_count} votes ({results[0]?.percentage}%)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Candidates</CardTitle>
                <Vote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vote Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={results}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="candidate_name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="vote_count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vote Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={results}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ candidate_name, percentage }) => `${candidate_name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="vote_count"
                  >
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={result.candidate_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{result.candidate_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.department} • {result.party_name} • {result.position}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{result.vote_count}</div>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {result.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};