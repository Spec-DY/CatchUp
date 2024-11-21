import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { useUser } from "../Context/UserContext";

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";
const LOCATION_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

// Register background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async () => {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== "granted") {
      await showLocationNotification();
      return BackgroundFetch.Result.Failed;
    }
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundFetch.Result.Failed;
  }
});

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const LocationPermissionManager = () => {
  const { user } = useUser();

  // Show notification
  const showLocationNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Location Sharing Required",
        body: "Please enable location sharing to keep connected with your friends",
        data: { screen: "Settings" },
      },
      trigger: null,
    });
  };

  // Check location permission and settings
  const checkLocationSettings = async () => {
    const locationEnabled = await Location.hasServicesEnabledAsync();
    const { status: foregroundStatus } =
      await Location.getForegroundPermissionsAsync();
    const { status: backgroundStatus } =
      await Location.getBackgroundPermissionsAsync();

    if (
      !locationEnabled ||
      foregroundStatus !== "granted" ||
      backgroundStatus !== "granted"
    ) {
      await showLocationNotification();
      return false;
    }

    if (!user.settings?.locationSharing) {
      await showLocationNotification();
      return false;
    }

    return true;
  };

  useEffect(() => {
    (async () => {
      // Request permissions
      const { status: notificationStatus } =
        await Notifications.requestPermissionsAsync();
      if (notificationStatus !== "granted") {
        console.log("Notification permission denied");
      }

      // Register background task
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_LOCATION_TASK, {
          minimumInterval: LOCATION_CHECK_INTERVAL,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (err) {
        console.log("Task registration failed:", err);
      }

      // Initial check
      await checkLocationSettings();
    })();

    // Set up periodic checks
    const intervalId = setInterval(
      checkLocationSettings,
      LOCATION_CHECK_INTERVAL
    );

    return () => {
      clearInterval(intervalId);
      BackgroundFetch.unregisterTaskAsync(BACKGROUND_LOCATION_TASK);
    };
  }, [user]);

  return null; // This is a background component, no UI needed
};

export default LocationPermissionManager;
