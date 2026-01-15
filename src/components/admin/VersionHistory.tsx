'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  History,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  User,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useContentService } from '@/hooks/use-content-service';
import { useAdminRole } from '@/hooks/use-admin-role';
import { ContentVersion } from '@/lib/cms/types';

// =============================================================================
// TYPES
// =============================================================================

interface VersionHistoryProps {
  docPath: string;
  contentType: string;
  currentVersion?: number;
  onRollback?: (newVersion: number) => void;
}

interface VersionItemProps {
  version: ContentVersion;
  isFirst: boolean;
  isCurrent: boolean;
  onPreview: () => void;
  onRollback: () => void;
  canRollback: boolean;
}

// =============================================================================
// VERSION ITEM COMPONENT
// =============================================================================

function VersionItem({
  version,
  isFirst,
  isCurrent,
  onPreview,
  onRollback,
  canRollback,
}: VersionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isFirst && (
        <div className="absolute left-5 -top-4 h-4 w-px bg-border" />
      )}
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-4">
          {/* Timeline dot */}
          <div
            className={`
              mt-1.5 h-2.5 w-2.5 rounded-full shrink-0
              ${isCurrent 
                ? 'bg-accent ring-4 ring-accent/20' 
                : version.isRollback 
                  ? 'bg-amber-500' 
                  : 'bg-muted-foreground'
              }
            `}
          />
          
          <div className="flex-1 min-w-0">
            <CollapsibleTrigger asChild>
              <button
                className="
                  w-full text-left
                  flex items-center gap-2
                  group
                "
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      Version {version.version}
                    </span>
                    
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                    
                    {version.isRollback && (
                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                        Rollback from v{version.rolledBackFrom}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(version.createdAt, { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.createdByEmail || version.createdBy}
                    </span>
                  </div>
                </div>
                
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-4">
                  {/* Timestamp */}
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Created: </span>
                    {format(version.createdAt, 'PPpp')}
                  </div>
                  
                  {/* Change description */}
                  {version.changeDescription && (
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Change: </span>
                      <span className="text-muted-foreground">{version.changeDescription}</span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onPreview}
                      className="h-8"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </Button>
                    
                    {canRollback && !isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRollback}
                        className="h-8 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Restore
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

// =============================================================================
// VERSION PREVIEW COMPONENT
// =============================================================================

interface VersionPreviewProps {
  version: ContentVersion | null;
  isOpen: boolean;
  onClose: () => void;
}

function VersionPreview({ version, isOpen, onClose }: VersionPreviewProps) {
  if (!version) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Version {version.version} Preview
          </SheetTitle>
          <SheetDescription>
            Saved {formatDistanceToNow(version.createdAt, { addSuffix: true })} by{' '}
            {version.createdByEmail || version.createdBy}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(version.contentSnapshot, null, 2)}
          </pre>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// MAIN VERSION HISTORY COMPONENT
// =============================================================================

export function VersionHistory({
  docPath,
  contentType,
  currentVersion,
  onRollback,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<ContentVersion | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<ContentVersion | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  
  const { getVersionHistory, rollbackToVersion } = useContentService();
  const { canRestoreVersions, canViewVersionHistory } = useAdminRole();
  const { toast } = useToast();

  // Fetch version history
  useEffect(() => {
    async function fetchVersions() {
      if (!canViewVersionHistory) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const history = await getVersionHistory(docPath, 30);
        setVersions(history);
      } catch (error) {
        console.error('Failed to fetch version history:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load version history',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVersions();
  }, [docPath, canViewVersionHistory, getVersionHistory, toast]);

  // Handle rollback
  const handleRollback = async () => {
    if (!rollbackTarget || !canRestoreVersions) return;
    
    setIsRollingBack(true);
    try {
      const result = await rollbackToVersion(
        docPath,
        contentType,
        rollbackTarget.version
      );
      
      if (result.success && result.data) {
        toast({
          title: 'Version Restored',
          description: `Successfully restored to version ${rollbackTarget.version}. New version: ${result.data.version}`,
        });
        
        // Refresh version history
        const history = await getVersionHistory(docPath, 30);
        setVersions(history);
        
        // Notify parent
        onRollback?.(result.data.version);
      } else {
        throw new Error(result.error || 'Failed to restore version');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Rollback Failed',
        description: error.message || 'Failed to restore version',
      });
    } finally {
      setIsRollingBack(false);
      setRollbackTarget(null);
    }
  };

  // Permission check
  if (!canViewVersionHistory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view version history.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No version history available yet. Save changes to create the first version.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            {versions.length} version{versions.length !== 1 ? 's' : ''} available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 pl-2">
              {versions.map((version, index) => (
                <VersionItem
                  key={version.versionId}
                  version={version}
                  isFirst={index === 0}
                  isCurrent={version.version === currentVersion}
                  canRollback={canRestoreVersions}
                  onPreview={() => setPreviewVersion(version)}
                  onRollback={() => setRollbackTarget(version)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Version Preview Sheet */}
      <VersionPreview
        version={previewVersion}
        isOpen={!!previewVersion}
        onClose={() => setPreviewVersion(null)}
      />

      {/* Rollback Confirmation Dialog */}
      <AlertDialog open={!!rollbackTarget} onOpenChange={() => setRollbackTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Restore Version {rollbackTarget?.version}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the content to version {rollbackTarget?.version} from{' '}
              {rollbackTarget && formatDistanceToNow(rollbackTarget.createdAt, { addSuffix: true })}.
              <br /><br />
              A new version will be created with the restored content.
              The current version will remain in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRollingBack}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              disabled={isRollingBack}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isRollingBack ? 'Restoring...' : 'Restore Version'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// VERSION HISTORY BUTTON (for inline use)
// =============================================================================

interface VersionHistoryButtonProps {
  docPath: string;
  contentType: string;
  currentVersion?: number;
  onRollback?: (newVersion: number) => void;
}

export function VersionHistoryButton({
  docPath,
  contentType,
  currentVersion,
  onRollback,
}: VersionHistoryButtonProps) {
  const { canViewVersionHistory } = useAdminRole();
  
  if (!canViewVersionHistory) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Version History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>
            View and restore previous versions of this content.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <VersionHistory
            docPath={docPath}
            contentType={contentType}
            currentVersion={currentVersion}
            onRollback={onRollback}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
