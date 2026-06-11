import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  Camera,
  CameraView,
} from "expo-camera";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FRAME_SIZE = SCREEN_WIDTH * 0.7;

interface BarcodeScannerModalProps {
  visible: boolean;
  testName: string;
  onScanned: (barcode: string) => void;
  onClose: () => void;
}

type PermissionStatus = "undetermined" | "granted" | "denied";

export function BarcodeScannerModal({
  visible,
  testName,
  onScanned,
  onClose,
}: BarcodeScannerModalProps) {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");
  const [scanned, setScanned] = useState(false);
  const hasScanned = useRef(false);

  // Check / request permissions when the modal becomes visible
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      const existing = await Camera.getCameraPermissionsAsync();
      if (cancelled) return;

      if (existing.granted) {
        setPermissionStatus("granted");
      } else if (existing.canAskAgain) {
        const result = await Camera.requestCameraPermissionsAsync();
        if (!cancelled) {
          setPermissionStatus(result.granted ? "granted" : "denied");
        }
      } else {
        setPermissionStatus("denied");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      hasScanned.current = false;
      setScanned(false);
      setPermissionStatus("undetermined");
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    setScanned(true);
    onScanned(data);
    // Brief delay so the user sees the flash before close
    setTimeout(() => {
      hasScanned.current = false;
      setScanned(false);
    }, 300);
  };

  const handleClose = () => {
    hasScanned.current = false;
    setScanned(false);
    onClose();
  };

  const handleGrantPermission = async () => {
    const result = await Camera.requestCameraPermissionsAsync();
    setPermissionStatus(result.granted ? "granted" : "denied");
  };

  if (!visible) return null;

  // Still determining permission
  if (permissionStatus === "undetermined") {
    return (
      <Modal visible animationType="slide" transparent={false}>
        <View style={styles.centeredContainer}>
          <Text style={styles.permissionText}>
            Requesting camera permission…
          </Text>
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (permissionStatus === "denied") {
    return (
      <Modal visible animationType="slide" transparent={false}>
        <View style={styles.centeredContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please allow camera access to scan barcodes.
          </Text>
          <TouchableOpacity
            style={styles.grantButton}
            onPress={handleGrantPermission}
          >
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={handleClose}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Granted — show scanner
  return (
    <Modal visible animationType="slide" transparent={false}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Camera */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              "code128",
              "code39",
              "code93",
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "qr",
              "pdf417",
              "datamatrix",
              "aztec",
            ],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />

        {/* Dark overlay with transparent cutout */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={[styles.overlaySegment, { flex: 1 }]} />
          <View style={{ flexDirection: "row" }}>
            <View
              style={[
                styles.overlaySegment,
                { width: (SCREEN_WIDTH - FRAME_SIZE) / 2, height: FRAME_SIZE },
              ]}
            />
            {/* Transparent viewfinder frame */}
            <View style={{ width: FRAME_SIZE, height: FRAME_SIZE }}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View
              style={[
                styles.overlaySegment,
                { width: (SCREEN_WIDTH - FRAME_SIZE) / 2, height: FRAME_SIZE },
              ]}
            />
          </View>
          <View style={[styles.overlaySegment, { flex: 1 }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Label below frame */}
        <View style={styles.labelContainer} pointerEvents="none">
          <View style={styles.testBadge}>
            <Text style={styles.testBadgeText} numberOfLines={1}>
              {testName}
            </Text>
          </View>
          <Text style={styles.hint}>
            Align the tube barcode within the frame
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = "#10b981";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    padding: 32,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  grantButton: {
    backgroundColor: "#065f46",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  grantButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  cancelLink: {
    paddingVertical: 8,
  },
  cancelLinkText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  overlaySegment: {
    backgroundColor: "rgba(0,0,0,0.6)",
    width: "100%",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  labelContainer: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.18,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  testBadge: {
    backgroundColor: "#065f46",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 10,
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  testBadgeText: {
    color: "#6ee7b7",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },
});
