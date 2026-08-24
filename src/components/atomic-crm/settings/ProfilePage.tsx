import { useMutation } from "@tanstack/react-query";
import { Check, CircleX, Copy, Pencil, Save } from "lucide-react";
import {
  Form,
  useDataProvider,
  useGetIdentity,
  useGetOne,
  useLocaleState,
  useLocales,
  useNotify,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { useState } from "react";
import { useFormState } from "react-hook-form";
import { RecordField } from "@/components/admin/record-fielda";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import ImageEditorField from "../misc/ImageEditorField";
import type { CrmDataProvider } from "../providers/types";
import type { Sale, SalesFormData } from "../types";

export const ProfilePage = () => {
  const [isEditMode, setEditMode] = useState(false);
  const { identity, refetch: refetchIdentity } = useGetIdentity();
  const { data, refetch: refetchUser } = useGetOne("sales", {
    id: identity?.id,
  });
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();

  const { mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      if (!identity) {
        throw new Error(
          translate("crm.profile.record_not_found", {
            _: "Record not found",
          }),
        );
      }
      return dataProvider.salesUpdate(identity.id, data);
    },
    onSuccess: () => {
      refetchIdentity();
      refetchUser();
      setEditMode(false);
      notify("crm.profile.updated", {
        messageArgs: {
          _: "Your profile has been updated",
        },
      });
    },
    onError: (_) => {
      notify("crm.profile.update_error", {
        type: "error",
        messageArgs: {
          _: "An error occurred. Please try again",
        },
      });
    },
  });

  if (!identity) return null;

  const handleOnSubmit = async (values: any) => {
    mutate(values);
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Form onSubmit={handleOnSubmit} record={data}>
        <ProfileForm isEditMode={isEditMode} setEditMode={setEditMode} />
      </Form>
    </div>
  );
};

const ProfileForm = ({
  isEditMode,
  setEditMode,
}: {
  isEditMode: boolean;
  setEditMode: (value: boolean) => void;
}) => {
  const notify = useNotify();
  const translate = useTranslate();
  const record = useRecordContext<Sale>();
  const { identity, refetch } = useGetIdentity();
  const { isDirty } = useFormState();
  const dataProvider = useDataProvider<CrmDataProvider>();

  const { mutate: updatePassword } = useMutation({
    mutationKey: ["updatePassword"],
    mutationFn: async () => {
      if (!identity) {
        throw new Error(
          translate("crm.profile.record_not_found", {
            _: "Record not found",
          }),
        );
      }
      return dataProvider.updatePassword(identity.id);
    },
    onSuccess: () => {
      notify("crm.profile.password_reset_sent", {
        messageArgs: {
          _: "A reset password email has been sent to your email address",
        },
      });
    },
    onError: (e) => {
      notify(`${e}`, {
        type: "error",
      });
    },
  });

  const { mutate: mutateSale } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      if (!record) {
        throw new Error(
          translate("crm.profile.record_not_found", {
            _: "Record not found",
          }),
        );
      }
      return dataProvider.salesUpdate(record.id, data);
    },
    onSuccess: () => {
      refetch();
      notify("crm.profile.updated", {
        messageArgs: {
          _: "Your profile has been updated",
        },
      });
    },
    onError: () => {
      notify("crm.profile.update_error", {
        type: "error",
        messageArgs: {
          _: "An error occurred. Please try again.",
        },
      });
    },
  });
  if (!identity) return null;

  const handleClickOpenPasswordChange = () => {
    updatePassword();
  };

  const handleAvatarUpdate = async (values: any) => {
    mutateSale(values);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <div className="mb-4 flex flex-row justify-between">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.profile.title")}
            </h2>
          </div>

          <div className="space-y-4 mb-4">
            <ImageEditorField
              source="avatar"
              type="avatar"
              onSave={handleAvatarUpdate}
              linkPosition="right"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextRender source="first_name" isEditMode={isEditMode} />
              <TextRender source="last_name" isEditMode={isEditMode} />
            </div>
            <TextRender source="email" isEditMode={isEditMode} />
            <LanguageSelector />
          </div>

          <div className="flex flex-row justify-end gap-2">
            {!isEditMode && (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleClickOpenPasswordChange}
                >
                  {translate("crm.profile.password.change")}
                </Button>
              </>
            )}

            <Button
              type="button"
              variant={isEditMode ? "ghost" : "outline"}
              onClick={() => setEditMode(!isEditMode)}
              className="flex items-center"
            >
              {isEditMode ? <CircleX /> : <Pencil />}
              {isEditMode
                ? translate("ra.action.cancel")
                : translate("ra.action.edit")}
            </Button>

            {isEditMode && (
              <Button type="submit" disabled={!isDirty} variant="outline">
                <Save />
                {translate("ra.action.save")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {import.meta.env.VITE_INBOUND_EMAIL && (
        <Card>
          <CardContent>
            <div className="space-y-4 justify-between">
              <h2 className="text-xl font-semibold text-muted-foreground">
                {translate("crm.profile.inbound.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {translate("crm.profile.inbound.description", {
                  _: "You can start sending emails to your server's inbound email address, e.g. by adding it to the Cc: field. Dalo CRM will process the emails and add notes to the corresponding contacts.",
                  field: "Cc:",
                })}
              </p>
              <CopyPaste value={import.meta.env.VITE_INBOUND_EMAIL} />
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent>
          <div className="space-y-4 justify-between">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.profile.mcp.title", {
                _: "MCP Server",
              })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {translate("crm.profile.mcp.description", {
                _: "Use this URL to connect your AI assistant to your CRM data via the Model Context Protocol (MCP).",
              })}
            </p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">URL</p>
              <CopyPaste
                value={`${import.meta.env.VITE_WORKER_URL || 'https://dalo-crm-api.dalo-crm.workers.dev'}/mcp`}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">API Key</p>
              <CopyPaste
                value={import.meta.env.VITE_API_KEY || 'dalo-crm-secret-2024'}
              />
            </div>
            <ConnectInstructions />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LanguageSelector = () => {
  const translate = useTranslate();
  const locales = useLocales();
  const [locale, setLocale] = useLocaleState();

  if (locales.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {translate("crm.language")}
      </p>
      <Select value={locale} onValueChange={setLocale}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((language) => (
            <SelectItem key={language.locale} value={language.locale}>
              {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const TextRender = ({
  source,
  isEditMode,
  className,
}: {
  source: string;
  isEditMode: boolean;
  className?: string;
}) => {
  const label = `resources.sales.fields.${source}`;
  if (isEditMode) {
    return (
      <TextInput
        source={source}
        label={label}
        helperText={false}
        className={className}
      />
    );
  }
  return (
    <div className={className}>
      <RecordField source={source} label={label} />
    </div>
  );
};

const CopyPaste = ({ value }: { value: string }) => {
  const translate = useTranslate();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText(value);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={handleCopy}
            variant="ghost"
            className="normal-case justify-between w-full"
          >
            <span className="overflow-hidden text-ellipsis">{value}</span>
            {copied ? (
              <Check className="h-4 w-4 ml-2" />
            ) : (
              <Copy className="h-4 w-4 ml-2" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {copied
              ? translate("crm.common.copied")
              : translate("crm.common.copy")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ConnectInstructions = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const mcpUrl = `${import.meta.env.VITE_WORKER_URL || 'https://dalo-crm-api.dalo-crm.workers.dev'}/mcp`;
  const apiKey = import.meta.env.VITE_API_KEY || 'dalo-crm-secret-2024';

  const config = JSON.stringify({
    mcpServers: {
      "dalo-crm": {
        command: "npx",
        args: ["-y", "mcp-remote", mcpUrl, "--header", `Authorization: Bearer ${apiKey}`]
      }
    }
  }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-left hover:bg-muted/50 transition-colors"
      >
        <span>How to connect Claude Desktop</span>
        <span className="text-muted-foreground text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Open Claude Desktop → Settings → Developer → Edit Config</li>
            <li>Paste the config below, save, restart Claude Desktop</li>
          </ol>
          <div className="relative">
            <pre className="text-xs bg-muted rounded p-3 overflow-x-auto whitespace-pre">{config}</pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 text-xs px-2 py-1 rounded border bg-background hover:bg-muted transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

ProfilePage.path = "/profile";
