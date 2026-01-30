import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMySubmissions } from '@/lib/actions/submissions';
import { MySubmissionsList } from '@/components/submissions/my-submissions-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Submissions | Cafes Seoul',
  description: 'View and manage your cafe submissions',
};

export default async function MySubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/profile/submissions');
  }
  
  // Fetch all submissions
  const result = await getMySubmissions();
  
  if (!result.success || !result.submissions) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
              <CardDescription>Failed to load your submissions. Please try again later.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }
  
  const allSubmissions = result.submissions;
  const pending = allSubmissions.filter(s => s.status === 'pending');
  const approved = allSubmissions.filter(s => s.status === 'approved');
  const declined = allSubmissions.filter(s => s.status === 'declined');
  
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-3xl font-bold">My Submissions</CardTitle>
            <CardDescription className="text-lg">
              Track the status of cafes you&apos;ve submitted
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Tabs defaultValue="pending" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending">
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="declined">
              Declined ({declined.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            <MySubmissionsList 
              submissions={pending} 
              emptyMessage="You have no pending submissions. Submit a new cafe to get started!"
              showActions={true}
            />
          </TabsContent>
          
          <TabsContent value="approved" className="mt-6">
            <MySubmissionsList 
              submissions={approved}
              emptyMessage="No approved submissions yet."
              showActions={false}
            />
          </TabsContent>
          
          <TabsContent value="declined" className="mt-6">
            <MySubmissionsList 
              submissions={declined}
              emptyMessage="No declined submissions."
              showActions={false}
              showRejectionReason={true}
            />
          </TabsContent>
        </Tabs>
        
        {/* Submit new button */}
        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link href="/submit">
              <Plus className="mr-2 h-4 w-4" />
              Submit a New Cafe
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
