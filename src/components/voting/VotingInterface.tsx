import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vote, CheckCircle, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  user_id: string;
  position: string;
  party_name: string;
  manifesto: string;
  profiles?: {
    full_name: string;
    student_id: string;
    department: string;
  };
}

interface VoteData {
  candidate_id: string;
  position: string;
}

export const VotingInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<{ [position: string]: string }>({});
  const [hasVoted, setHasVoted] = useState<{ [electionId: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActiveElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchCandidates(selectedElection.id);
      checkVotingStatus(selectedElection.id);
    }
  }, [selectedElection, user]);

  const fetchActiveElections = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .eq("is_active", true)
        .lte("start_time", now)
        .gte("end_time", now)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error("Error fetching elections:", error);
      toast({
        title: "Error",
        description: "Failed to load active elections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (electionId: string) => {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select(`
          *,
          profiles:user_id (
            full_name,
            student_id,
            department
          )
        `)
        .eq("election_id", electionId)
        .eq("is_approved", true)
        .order("position");

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      });
    }
  };

  const checkVotingStatus = async (electionId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("votes")
        .select("id")
        .eq("election_id", electionId)
        .eq("voter_id", user.id);

      if (error) throw error;
      
      setHasVoted(prev => ({
        ...prev,
        [electionId]: (data || []).length > 0
      }));
    } catch (error) {
      console.error("Error checking voting status:", error);
    }
  };

  const handleCandidateSelect = (position: string, candidateId: string) => {
    setSelectedCandidates(prev => ({
      ...prev,
      [position]: candidateId
    }));
  };

  const submitVotes = async () => {
    if (!user || !selectedElection) return;

    const votesToSubmit = Object.entries(selectedCandidates).map(([position, candidateId]) => ({
      voter_id: user.id,
      candidate_id: candidateId,
      election_id: selectedElection.id,
      position: position,
    }));

    if (votesToSubmit.length === 0) {
      toast({
        title: "No votes selected",
        description: "Please select candidates to vote for",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("votes")
        .insert(votesToSubmit);

      if (error) throw error;

      toast({
        title: "Vote Submitted Successfully!",
        description: "Thank you for participating in the election",
      });

      // Reset selections and update voting status
      setSelectedCandidates({});
      setHasVoted(prev => ({
        ...prev,
        [selectedElection.id]: true
      }));
    } catch (error: any) {
      console.error("Error submitting votes:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit votes",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isElectionActive = (election: Election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);
    return now >= startTime && now <= endTime;
  };

  // Group candidates by position
  const candidatesByPosition = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.position]) {
      acc[candidate.position] = [];
    }
    acc[candidate.position].push(candidate);
    return acc;
  }, {} as { [position: string]: Candidate[] });

  const positions = Object.keys(candidatesByPosition);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading elections...</p>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Active Elections</h3>
          <p className="text-muted-foreground">
            There are currently no active elections available for voting.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Vote Now</h2>
        <p className="text-muted-foreground">Select an election and cast your vote</p>
      </div>

      {/* Election Selection */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Active Elections:</h3>
        {elections.map((election) => {
          const voted = hasVoted[election.id];
          const active = isElectionActive(election);
          
          return (
            <Card 
              key={election.id} 
              className={`cursor-pointer transition-all ${
                selectedElection?.id === election.id ? 'ring-2 ring-primary' : ''
              } ${voted ? 'opacity-75' : ''}`}
              onClick={() => !voted && active && setSelectedElection(election)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {election.title}
                      {voted && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {!active && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{election.description}</p>
                  </div>
                  <Badge variant={voted ? "outline" : active ? "default" : "secondary"}>
                    {voted ? "Voted" : active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              {selectedElection?.id === election.id && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Election ends: {new Date(election.end_time).toLocaleString()}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Voting Interface */}
      {selectedElection && !hasVoted[selectedElection.id] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Cast Your Vote - {selectedElection.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {positions.map((position) => (
              <div key={position} className="space-y-4">
                <h4 className="text-lg font-semibold border-b pb-2">{position}</h4>
                <div className="grid gap-3">
                  {candidatesByPosition[position].map((candidate) => (
                    <Card 
                      key={candidate.id}
                      className={`cursor-pointer transition-all ${
                        selectedCandidates[position] === candidate.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleCandidateSelect(position, candidate.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4" />
                              <h5 className="font-semibold">{candidate.profiles?.full_name}</h5>
                              {selectedCandidates[position] === candidate.id && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Student ID:</strong> {candidate.profiles?.student_id}</p>
                              <p><strong>Department:</strong> {candidate.profiles?.department}</p>
                              <p><strong>Party:</strong> {candidate.party_name}</p>
                              {candidate.manifesto && (
                                <p><strong>Manifesto:</strong> {candidate.manifesto}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={Object.keys(selectedCandidates).length === 0 || submitting}
                    className="min-w-32"
                  >
                    <Vote className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit Vote"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to submit your vote? This action cannot be undone.
                      <div className="mt-4 space-y-2">
                        <strong>Your selections:</strong>
                        {Object.entries(selectedCandidates).map(([position, candidateId]) => {
                          const candidate = candidates.find(c => c.id === candidateId);
                          return (
                            <div key={position} className="text-sm">
                              <strong>{position}:</strong> {candidate?.profiles?.full_name}
                            </div>
                          );
                        })}
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={submitVotes}>
                      Confirm Vote
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};