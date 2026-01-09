import { useCallback, useEffect, useState } from "react";
import {
	createPushSubscriptionFn,
	getVapidPublicKeyFn,
} from "@/server/notifications";
import { useAuth } from "./useAuth";

interface PushNotificationState {
	permission: NotificationPermission;
	isSupported: boolean;
	isSubscribed: boolean;
}

interface UsePushNotificationsReturn extends PushNotificationState {
	requestPermission: () => Promise<boolean>;
	subscribe: () => Promise<void>;
	checkSubscriptionStatus: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
	const { csrfToken } = useAuth();

	const [state, setState] = useState<PushNotificationState>({
		permission: "default",
		isSupported: false,
		isSubscribed: false,
	});

	// Check support and initial subscription status
	useEffect(() => {
		const initialize = async () => {
			const isSupported =
				"serviceWorker" in navigator &&
				"PushManager" in window &&
				"Notification" in window;

			if (!isSupported) {
				setState({
					permission: "denied",
					isSupported: false,
					isSubscribed: false,
				});
				return;
			}

			const permission = Notification.permission;

			// Check if already subscribed
			let isSubscribed = false;
			try {
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription();
				isSubscribed = !!subscription;
			} catch (error) {
				console.error("Error checking initial subscription:", error);
			}

			setState({
				permission,
				isSupported,
				isSubscribed,
			});
		};

		initialize();
	}, []);

	// Request notification permission
	const requestPermission = useCallback(async (): Promise<boolean> => {
		if (!state.isSupported) {
			console.warn("Push notifications are not supported");
			return false;
		}

		try {
			const permission = await Notification.requestPermission();
			setState((prev) => ({ ...prev, permission }));
			return permission === "granted";
		} catch (error) {
			console.error("Error requesting notification permission:", error);
			return false;
		}
	}, [state.isSupported]);

	// Subscribe to push notifications
	const subscribe = useCallback(async (): Promise<void> => {
		// Read from state ref to avoid stale closures
		setState((currentState) => {
			if (!currentState.isSupported) {
				throw new Error("Push notifications are not supported");
			}
			if (currentState.permission !== "granted") {
				throw new Error("Notification permission not granted");
			}
			return currentState;
		});

		try {
			const registration = await navigator.serviceWorker.ready;
			let subscription = await registration.pushManager.getSubscription();

			if (!subscription) {
				const { publicKey } = await getVapidPublicKeyFn();
				const applicationServerKey = urlBase64ToArrayBuffer(publicKey);

				subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey,
				});
			}

			const subscriptionJson = subscription.toJSON();

			if (
				!subscriptionJson.endpoint ||
				!subscriptionJson.keys?.p256dh ||
				!subscriptionJson.keys?.auth
			) {
				throw new Error("Invalid subscription data");
			}

			await createPushSubscriptionFn({
				data: {
					endpoint: subscriptionJson.endpoint,
					p256dh: subscriptionJson.keys.p256dh,
					auth: subscriptionJson.keys.auth,
					expirationTime: subscriptionJson.expirationTime || null,
					csrfToken,
				},
			});

			setState((prev) => ({
				...prev,
				isSubscribed: true,
			}));
		} catch (error) {
			console.error("Error subscribing to push notifications:", error);
			throw error;
		}
	}, [csrfToken]);

	// Check current subscription status
	const checkSubscriptionStatus = useCallback(async (): Promise<void> => {
		if (!state.isSupported) {
			return;
		}

		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();

			setState((prev) => ({
				...prev,
				isSubscribed: !!subscription,
			}));
		} catch (error) {
			console.error("Error checking subscription status:", error);
		}
	}, [state.isSupported]);

	return {
		...state,
		requestPermission,
		subscribe,
		checkSubscriptionStatus,
	};
}

// Helper function to convert base64 VAPID key to ArrayBuffer
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}

	return outputArray.buffer;
}
