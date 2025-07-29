import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vote, Users, ShieldCheck, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold mb-4">Digital Ballot College</CardTitle>
            <CardDescription className="text-xl">
              Secure E-Voting System for Student Elections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Secure Voting</h3>
                <p className="text-sm text-muted-foreground text-center">
                  End-to-end encrypted voting system
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Student Verification</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Only eligible students can vote
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Vote className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Easy Voting</h3>
                <p className="text-sm text-muted-foreground text-center">
                  User-friendly voting interface
                </p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Clock className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Real-time Results</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Live election monitoring
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">Transparent</Badge>
                <Badge variant="secondary">Secure</Badge>
                <Badge variant="secondary">Efficient</Badge>
              </div>
              <Button onClick={() => navigate("/auth")} size="lg" className="w-full md:w-auto">
                Get Started - Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;
