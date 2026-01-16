'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Users,
  MousePointerClick,
  TrendingUp,
  ExternalLink,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getProfileUrl } from '@/lib/seera-link/utils';

interface AnalyticsData {
  period: number;
  maxPeriod: number;
  totalViews: number;
  uniqueViews: number;
  topCta: { type: string; clicks: number } | null;
  ctaClicks: { type: string; clicks: number }[];
  topSources: { source: string; views: number }[];
  deviceBreakdown: { device: string; count: number }[];
  dailyViews: { date: string; views: number; uniqueViews: number }[];
}

interface Profile {
  id: string;
  slug: string;
  displayName: string;
  status: string;
}

const ctaLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  PHONE: 'Phone',
  EMAIL: 'Email',
  LINKEDIN: 'LinkedIn',
  DOWNLOAD_CV: 'Download CV',
  VIEW_CV: 'View CV',
};

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  // Fetch profile and analytics
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [profileRes, analyticsRes] = await Promise.all([
          fetch(`/api/seera-link/${profileId}`),
          fetch(`/api/seera-link/${profileId}/analytics?days=${period}`),
        ]);

        const profileData = await profileRes.json();
        const analyticsData = await analyticsRes.json();

        if (!profileRes.ok) {
          throw new Error(profileData.error?.message || 'Failed to load profile');
        }

        setProfile(profileData.data);
        setAnalytics(analyticsData.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [profileId, period]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10" />
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!profile || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-destructive mb-4">Failed to load analytics</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/seera-link')}>
          Back to Seera Link
        </Button>
      </div>
    );
  }

  const viewsChange = analytics.dailyViews.length >= 2
    ? ((analytics.dailyViews[analytics.dailyViews.length - 1]?.views || 0) -
       (analytics.dailyViews[0]?.views || 0))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/seera-link">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {profile.displayName}
              {profile.status === 'PUBLISHED' && (
                <Badge variant="default">Published</Badge>
              )}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Analytics for /p/{profile.slug}
              <a
                href={getProfileUrl(profile.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              {analytics.maxPeriod >= 30 && (
                <SelectItem value="30">Last 30 days</SelectItem>
              )}
              {analytics.maxPeriod >= 90 && (
                <SelectItem value="90">Last 90 days</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            {viewsChange !== 0 && (
              <p className={`text-xs ${viewsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {viewsChange > 0 ? '+' : ''}{viewsChange} from first day
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Visitors
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalViews > 0
                ? `${((analytics.uniqueViews / analytics.totalViews) * 100).toFixed(1)}% unique`
                : 'No views yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top CTA
            </CardTitle>
            <MousePointerClick className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analytics.topCta ? (
              <>
                <div className="text-2xl font-bold">
                  {ctaLabels[analytics.topCta.type] || analytics.topCta.type}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.topCta.clicks} clicks
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total CTA Clicks
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.ctaClicks.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalViews > 0
                ? `${((analytics.ctaClicks.reduce((sum, c) => sum + c.clicks, 0) / analytics.totalViews) * 100).toFixed(1)}% CTR`
                : 'No views yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily Views */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Views</CardTitle>
            <CardDescription>Views over the last {period} days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyViews.length > 0 ? (
              <div className="h-48">
                <div className="flex items-end justify-between h-full gap-1">
                  {analytics.dailyViews.map((day, i) => {
                    const maxViews = Math.max(...analytics.dailyViews.map(d => d.views), 1);
                    const height = (day.views / maxViews) * 100;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${day.date}: ${day.views} views`}
                        />
                        {analytics.dailyViews.length <= 14 && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(day.date).getDate()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>CTA Clicks</CardTitle>
            <CardDescription>Breakdown by action type</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.ctaClicks.length > 0 ? (
              <div className="space-y-3">
                {analytics.ctaClicks.map((cta) => {
                  const total = analytics.ctaClicks.reduce((sum, c) => sum + c.clicks, 0);
                  const percentage = total > 0 ? (cta.clicks / total) * 100 : 0;
                  return (
                    <div key={cta.type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{ctaLabels[cta.type] || cta.type}</span>
                        <span className="text-muted-foreground">
                          {cta.clicks} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No CTA clicks yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>Visitor device types</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.deviceBreakdown.length > 0 ? (
              <div className="space-y-3">
                {analytics.deviceBreakdown.map((device) => {
                  const total = analytics.deviceBreakdown.reduce((sum, d) => sum + d.count, 0);
                  const percentage = total > 0 ? (device.count / total) * 100 : 0;
                  return (
                    <div key={device.device} className="flex items-center justify-between">
                      <span className="capitalize">{device.device}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No device data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Top UTM sources</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topSources.length > 0 ? (
              <div className="space-y-3">
                {analytics.topSources.map((source, i) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      <span>{source.source}</span>
                    </div>
                    <Badge variant="secondary">{source.views} views</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>No UTM sources tracked</p>
                  <p className="text-xs mt-1">
                    Add ?utm_source=xxx to your links
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
