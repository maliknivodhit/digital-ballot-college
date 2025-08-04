import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Save,
  X,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  election_id: string;
  position: string;
  party_name: string;
  manifesto: string;
  is_approved: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    student_id: string;
    department: string;
  };
}

export const CandidateManagement = () => {
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  
  const [formData, setFormData] = useState({
    candidateName: "",
    studentId: "",
    department: "",
    position: "",
    partyName: "",
    manifesto: "",
    electionId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch elections
      const { data: electionsData, error: electionsError } = await supabase
        .from("elections")
        .select("*")
        .order("created_at", { ascending: false });

      if (electionsError) throw electionsError;
      setElections(electionsData || []);

      // Fetch candidates with profiles
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("candidates")
        .select(`
          *,
          profiles:user_id (
            full_name,
            student_id,
            department
          )
        `)
        .order("created_at", { ascending: false });

      if (candidatesError) throw candidatesError;
      setCandidates(candidatesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.candidateName || !formData.studentId || !formData.electionId || !formData.position) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First, create or find the user profile
      let userId;
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("student_id", formData.studentId)
        .single();

      if (existingProfile) {
        userId = existingProfile.user_id;
      } else {
        // Create a temporary user entry for the candidate
        const tempEmail = `${formData.studentId}@temp.college.edu`;
        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email: tempEmail,
          password: "temp123456", // Temporary password
          options: {
            data: {
              full_name: formData.candidateName,
              student_id: formData.studentId,
              department: formData.department,
              year_of_study: 1,
            },
          },
        });

        if (authError) {
          // If user already exists, try to find them
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("student_id", formData.studentId);
          
          if (profiles && profiles.length > 0) {
            userId = profiles[0].user_id;
          } else {
            throw authError;
          }
        } else {
          userId = authUser.user?.id;
        }
      }

      if (!userId) {
        throw new Error("Could not create or find user");
      }

      const candidateData = {
        user_id: userId,
        election_id: formData.electionId,
        position: formData.position,
        party_name: formData.partyName || "Independent",
        manifesto: formData.manifesto || "",
        is_approved: true, // Auto-approve for admin created candidates
      };

      if (editingCandidate?.id) {
        // Update existing candidate
        const { error } = await supabase
          .from("candidates")
          .update(candidateData)
          .eq("id", editingCandidate.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Candidate updated successfully",
        });
      } else {
        // Create new candidate
        const { error } = await supabase
          .from("candidates")
          .insert([candidateData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Candidate added successfully",
        });
      }

      setShowForm(false);
      setEditingCandidate(null);
      setFormData({
        candidateName: "",
        studentId: "",
        department: "",
        position: "",
        partyName: "",
        manifesto: "",
        electionId: "",
      });
      fetchData();
    } catch (error: any) {
      console.error("Error saving candidate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save candidate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (candidateId: string) => {
    try {
      const { error } = await supabase
        .from("candidates")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate removed successfully",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast({
        title: "Error",
        description: "Failed to remove candidate",
        variant: "destructive",
      });
    }
  };

  const filteredCandidates = selectedElectionId 
    ? candidates.filter(c => c.election_id === selectedElectionId)
    : candidates;

  if (showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editingCandidate ? "Edit Candidate" : "Add New Candidate"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="election">Select Election *</Label>
            <Select 
              value={formData.electionId} 
              onValueChange={(value) => setFormData({ ...formData, electionId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose election" />
              </SelectTrigger>
              <SelectContent>
                {elections.map((election) => (
                  <SelectItem key={election.id} value={election.id}>
                    {election.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="candidateName">Candidate Name *</Label>
            <Input
              id="candidateName"
              value={formData.candidateName}
              onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
              placeholder="Enter candidate full name"
            />
          </div>

          <div>
            <Label htmlFor="studentId">Student ID *</Label>
            <Input
              id="studentId"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              placeholder="Enter student ID"
            />
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div>
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., President, Vice President"
            />
          </div>

          <div>
            <Label htmlFor="partyName">Party/Group Name</Label>
            <Input
              id="partyName"
              value={formData.partyName}
              onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
              placeholder="Optional party affiliation"
            />
          </div>

          <div>
            <Label htmlFor="manifesto">Manifesto/Slogan</Label>
            <Textarea
              id="manifesto"
              value={formData.manifesto}
              onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
              placeholder="Candidate's manifesto or campaign slogan"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Candidate"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Candidate Management</h2>
          <p className="text-muted-foreground">Add and manage election candidates</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Candidate
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Label>Filter by Election:</Label>
        <Select value={selectedElectionId} onValueChange={setSelectedElectionId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Elections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Elections</SelectItem>
            {elections.map((election) => (
              <SelectItem key={election.id} value={election.id}>
                {election.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Candidates Found</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding candidates to elections
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCandidates.map((candidate) => {
            const election = elections.find(e => e.id === candidate.election_id);
            
            return (
              <Card key={candidate.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5" />
                        <CardTitle className="text-lg">
                          {candidate.profiles?.full_name || "Unknown"}
                        </CardTitle>
                        <Badge variant={candidate.is_approved ? "default" : "secondary"}>
                          {candidate.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Election:</strong> {election?.title || "Unknown"}</p>
                        <p><strong>Position:</strong> {candidate.position}</p>
                        <p><strong>Student ID:</strong> {candidate.profiles?.student_id}</p>
                        <p><strong>Department:</strong> {candidate.profiles?.department}</p>
                        <p><strong>Party:</strong> {candidate.party_name}</p>
                        {candidate.manifesto && (
                          <p><strong>Manifesto:</strong> {candidate.manifesto}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCandidate(candidate);
                        setFormData({
                          candidateName: candidate.profiles?.full_name || "",
                          studentId: candidate.profiles?.student_id || "",
                          department: candidate.profiles?.department || "",
                          position: candidate.position,
                          partyName: candidate.party_name,
                          manifesto: candidate.manifesto || "",
                          electionId: candidate.election_id,
                        });
                        setShowForm(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Candidate</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{candidate.profiles?.full_name}" from this election? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(candidate.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};