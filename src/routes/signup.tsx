import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Flame } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/signup")({ component: SignUp });

function SignUp() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			console.log("Form submitted:", value);
			navigate({ to: "/choose-habits" });
		},
	});

	return (
		<div className="min-h-screen flex flex-col bg-background px-6 py-12">
			{/* Logo */}
			<div className="flex items-center justify-center gap-2 mb-12 animate-fade-in">
				<div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
					<Flame className="w-6 h-6 text-primary-foreground" />
				</div>
				<span className="text-2xl font-bold gradient-text">Dopamine Kick</span>
			</div>

			{/* Form */}
			<div className="flex-1 flex flex-col max-w-md mx-auto w-full">
				<div className="animate-fade-in-up">
					<h1 className="text-3xl font-bold mb-2">Create your account</h1>
					<p className="text-muted-foreground mb-8">
						Start building habits that stick
					</p>
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field name="name">
						{(field) => (
							<div className="animate-fade-in-up animation-delay-200">
								<label
									htmlFor={field.name}
									className="block text-sm font-medium mb-2"
								>
									Your name
								</label>
								<Input
									id={field.name}
									name={field.name}
									type="text"
									placeholder="Enter your name"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									required
								/>
							</div>
						)}
					</form.Field>

					<form.Field name="email">
						{(field) => (
							<div className="animate-fade-in-up animation-delay-400">
								<label
									htmlFor={field.name}
									className="block text-sm font-medium mb-2"
								>
									Email address
								</label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									placeholder="you@example.com"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									required
								/>
							</div>
						)}
					</form.Field>

					<form.Field
						name="password"
						validators={{
							onSubmit: ({ value }) => {
								if (value.length < 8) {
									return "Password must be at least 8 characters";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="animate-fade-in-up animation-delay-500">
								<label
									htmlFor={field.name}
									className="block text-sm font-medium mb-2"
								>
									Password
								</label>
								<div className="relative">
									<Input
										id={field.name}
										name={field.name}
										type={showPassword ? "text" : "password"}
										placeholder="Create a strong password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										required
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									>
										{showPassword ? (
											<EyeOff className="w-5 h-5" />
										) : (
											<Eye className="w-5 h-5" />
										)}
									</button>
								</div>
								{field.state.meta.errors.length > 0 && (
									<p className="text-sm text-destructive mt-1">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Field
						name="confirmPassword"
						validators={{
							onSubmit: ({ value, fieldApi }) => {
								if (value !== fieldApi.form.getFieldValue("password")) {
									return "Passwords do not match";
								}
								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="animate-fade-in-up animation-delay-600">
								<label
									htmlFor={field.name}
									className="block text-sm font-medium mb-2"
								>
									Re-enter your password
								</label>
								<div className="relative">
									<Input
										id={field.name}
										name={field.name}
										type={showPassword ? "text" : "password"}
										placeholder="Confirm your password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										required
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									>
										{showPassword ? (
											<EyeOff className="w-5 h-5" />
										) : (
											<Eye className="w-5 h-5" />
										)}
									</button>
								</div>
								{field.state.meta.errors.length > 0 && (
									<p className="text-sm text-destructive mt-1">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<div className="pt-4 animate-fade-in-up animation-delay-700">
						<Button
							type="submit"
							className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
							size="lg"
						>
							Create Account
						</Button>
					</div>
				</form>

				<p className="text-center text-muted-foreground mt-8 animate-fade-in-up">
					Already have an account?{" "}
					<button
						type="button"
						onClick={() => {
							window.location.href = "/bff/login";
						}}
						className="text-primary font-semibold hover:underline"
					>
						Sign in
					</button>
				</p>
			</div>
		</div>
	);
}
