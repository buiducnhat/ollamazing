import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { preferencesState } from "@/lib/states/preferences.state";
import { zodResolver } from "@hookform/resolvers/zod";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSnapshot } from "valtio";
import * as z from "zod";

const formSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  lang: z.enum(["en", "vi"]).default("en"),
});

const themeOptions = [
  { label: "System", value: "system", icon: MonitorIcon },
  { label: "Dark", value: "dark", icon: MoonIcon },
  { label: "Light", value: "light", icon: SunIcon },
];

const langOptions = [
  { label: "English", value: "en" },
  { label: "Vietnamese", value: "vi" },
];

export function PreferencesForm() {
  const snap = useSnapshot(preferencesState);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme: snap.theme,
      lang: snap.lang,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    preferencesState.theme = values.theme;
    preferencesState.lang = values.lang;
    toast.success("Preferences updated");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <option.icon />
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lang"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {langOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}
