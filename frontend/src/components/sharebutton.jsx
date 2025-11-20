import { useState } from "react";
import { Share2, Facebook, Instagram, Twitter, Link2, MessageCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const ShareButton = ({ pollId, pollDescription }) => {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchShareData = async () => {
    if (shareData) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/polls/${pollId}/share`);
      
      if (response.ok) {
        const data = await response.json();
        setShareData(data.data);
      }
    } catch (error) {
      toast.error("Failed to load share data");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData?.url || window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const text = shareData?.text || `Check out this poll: ${pollDescription}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareData?.url || window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we copy the link
    copyToClipboard(shareData?.url || window.location.href);
    toast.info("Link copied! You can now paste it in your Instagram story or bio");
  };

  const shareOnWhatsApp = () => {
    const text = shareData?.text || `Check out this poll: ${pollDescription}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + (shareData?.url || window.location.href))}`;
    window.open(url, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share && shareData) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    } else {
      copyToClipboard(shareData?.url || window.location.href);
    }
  };

  return (
    <Popover onOpenChange={(open) => open && fetchShareData()}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium">Share this poll</h4>
          
          {loading ? (
            <div className="text-center py-2">Loading...</div>
          ) : (
            <>
              <div className="space-y-2">
                <Button
                  onClick={shareNative}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share via...
                </Button>
                
                <Button
                  onClick={shareOnFacebook}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Share on Facebook
                </Button>
                
                <Button
                  onClick={shareOnTwitter}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Twitter className="h-4 w-4 text-blue-400" />
                  Share on Twitter
                </Button>
                
                <Button
                  onClick={shareOnInstagram}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Instagram className="h-4 w-4 text-pink-600" />
                  Share on Instagram
                </Button>

                <Button
                  onClick={shareOnWhatsApp}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  Share on WhatsApp
                </Button>

                <Button
                  onClick={() => copyToClipboard(shareData?.url || window.location.href)}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>
              
              {shareData && (
                <div className="pt-2 border-t">
                  <Input
                    value={shareData.url}
                    readOnly
                    className="text-xs"
                    onClick={(e) => e.target.select()}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
