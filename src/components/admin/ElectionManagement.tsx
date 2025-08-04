import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock,
  Users,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ElectionForm } from "./ElectionForm";
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
  created_at: string;
}

export const ElectionManagement = () => {
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
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
        description: "Failed to load elections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (electionId: string) => {
    try {
      const { error } = await supabase
        .from("elections")
        .delete()
        .eq("id", electionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Election deleted successfully",
      });
      fetchElections();
    } catch (error) {
      console.error("Error deleting election:", error);
      toast({
        title: "Error",
        description: "Failed to delete election",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (election: Election) => {
    try {
      const { error } = await supabase
        .from("elections")
        .update({ is_active: !election.is_active })
        .eq("id", election.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Election ${!election.is_active ? "activated" : "deactivated"} successfully`,
      });
      fetchElections();
    } catch (error) {
      console.error("Error updating election:", error);
      toast({
        title: "Error",
        description: "Failed to update election status",
        variant: "destructive",
      });
    }
  };

  const getElectionStatus = (election: Election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);

    if (!election.is_active) return "inactive";
    if (now < startTime) return "upcoming";
    if (now > endTime) return "ended";
    return "active";
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingElection(null);
    fetchElections();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingElection(null);
  };

  if (showForm) {
    return (
      <ElectionForm
        election={editingElection || undefined}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Election Management</h2>
          <p className="text-muted-foreground">Create and manage college elections</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Election
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading elections...</p>
        </div>
      ) : elections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Elections Found</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first election
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Election
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {elections.map((election) => {
            const status = getElectionStatus(election);
            
            return (
              <Card key={election.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{election.title}</CardTitle>
                        <Badge 
                          variant={
                            status === "active" ? "default" : 
                            status === "upcoming" ? "secondary" : 
                            status === "inactive" ? "outline" : "outline"
                          }
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      {election.description && (
                        <p className="text-muted-foreground text-sm">{election.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Start: {new Date(election.start_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>End: {new Date(election.end_time).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingElection(election);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      variant={election.is_active ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(election)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {election.is_active ? "Deactivate" : "Activate"}
                    </Button>

                    <Button variant="outline" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      Candidates
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Election</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{election.title}"? This action cannot be undone.
                            All associated candidates and votes will also be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(election.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
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