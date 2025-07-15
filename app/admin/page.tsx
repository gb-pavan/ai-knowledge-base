import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDatabase } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Brain,
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  Plus,
  Activity,
} from 'lucide-react';

async function getAdminStats() {
  const db = await getDatabase();
  
  const [
    totalArticles,
    publishedArticles,
    totalMessages,
    totalUsers,
    recentFeedback,
  ] = await Promise.all([
    db.collection('articles').countDocuments(),
    db.collection('articles').countDocuments({ isPublished: true }),
    db.collection('chat_messages').countDocuments(),
    db.collection('users').countDocuments(),
    db.collection('feedback').countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
  ]);

  return {
    totalArticles,
    publishedArticles,
    totalMessages,
    totalUsers,
    recentFeedback,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/auth/signin');
  }

  const stats = await getAdminStats();

  const quickActions = [
    {
      title: 'Create Article',
      description: 'Add new knowledge base article',
      href: '/admin/articles/new',
      icon: Plus,
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Articles',
      description: 'View and edit existing articles',
      href: '/admin/articles',
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      title: 'View Analytics',
      description: 'Check usage statistics',
      href: '/admin/analytics',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Manage Users',
      description: 'User management and roles',
      href: '/admin/users',
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  const statsCards = [
    {
      title: 'Total Articles',
      value: stats.totalArticles,
      description: `${stats.publishedArticles} published`,
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      title: 'Chat Messages',
      value: stats.totalMessages,
      description: 'Total conversations',
      icon: MessageSquare,
      color: 'text-green-600',
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      description: 'Registered users',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Recent Feedback',
      value: stats.recentFeedback,
      description: 'Last 7 days',
      icon: Activity,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}
          </p>
        </div>
        <Badge variant="default" className="flex items-center space-x-1">
          <Brain className="h-4 w-4" />
          <span>Administrator</span>
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 ${action.color} rounded-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">System Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Published Articles</span>
                <Badge variant="secondary">
                  {stats.publishedArticles}/{stats.totalArticles}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Draft Articles</span>
                <Badge variant="outline">
                  {stats.totalArticles - stats.publishedArticles}
                </Badge>
              </div>
              <div className="pt-2">
                <Link href="/admin/articles/new">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Article
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Messages</span>
                <Badge variant="secondary">{stats.totalMessages}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Recent Feedback</span>
                <Badge variant="outline">{stats.recentFeedback}</Badge>
              </div>
              <div className="pt-2">
                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}