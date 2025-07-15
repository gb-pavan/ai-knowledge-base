"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, Eye, EyeOff, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ArticleFormProps {
  article?: {
    _id: string;
    title: string;
    content: string;
    summary?: string;
    tags: string[];
    isPublished: boolean;
  };
}

export function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: article?.title || '',
    content: article?.content || '',
    isPublished: article?.isPublished || false,
  });
  const [aiData, setAiData] = useState({
    summary: article?.summary || '',
    tags: article?.tags || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const url = article ? `/api/articles/${article._id}` : '/api/articles';
      const method = article ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      const data = await response.json();
      
      // If it's a new article, fetch the updated data to get AI-generated content
      if (!article && data.articleId) {
        const articleResponse = await fetch(`/api/articles/${data.articleId}`);
        if (articleResponse.ok) {
          const articleData = await articleResponse.json();
          setAiData({
            summary: articleData.summary || '',
            tags: articleData.tags || [],
          });
        }
      }

      toast.success(article ? 'Article updated successfully' : 'Article created successfully');
      
      if (!article) {
        router.push('/admin/articles');
      }
    } catch (error) {
      toast.error('Failed to save article');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {article ? 'Edit Article' : 'Create New Article'}
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center space-x-2"
          >
            {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{isPreview ? 'Edit' : 'Preview'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
            </CardHeader>
            <CardContent>
              {isPreview ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{formData.title}</h2>
                    {aiData.summary && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">AI Summary:</p>
                        <p className="text-sm">{aiData.summary}</p>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                    {formData.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter article title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content * (Markdown supported)</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your article content here..."
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      disabled={isLoading}
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="published"
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                        disabled={isLoading}
                      />
                      <Label htmlFor="published">Publish immediately</Label>
                    </div>

                    <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{article ? 'Update' : 'Create'} Article</span>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiData.summary && (
                <div>
                  <Label className="text-sm font-medium">AI Summary</Label>
                  <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                    {aiData.summary}
                  </p>
                </div>
              )}

              {aiData.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">AI Generated Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {aiData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(!aiData.summary && !aiData.tags.length) && (
                <div className="text-center py-4">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    AI insights will be generated when you save the article
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant={formData.isPublished ? 'default' : 'secondary'}>
                    {formData.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                {article && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Views:</span>
                    <span className="text-sm text-muted-foreground">
                      {(article as any).viewCount || 0}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}