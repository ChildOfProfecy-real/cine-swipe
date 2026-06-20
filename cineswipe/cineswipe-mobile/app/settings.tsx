import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Linking, Alert, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../src/lib/store";
import { useRouter } from "expo-router";
import { ArrowLeft, LogOut, Bell, Shield, Info, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { deleteAccountAPI } from "../src/lib/api";

export default function SettingsScreen() {
    const router = useRouter();
    const { logout } = useAppStore();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", onPress: performLogout, style: "destructive" }
            ]
        );
    };

    const performLogout = async () => {
        await logout();
        router.replace("/login");
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            Alert.alert("Error", "Please enter your password to confirm account deletion.");
            return;
        }

        setIsDeleting(true);
        try {
            await deleteAccountAPI(deletePassword);
            Alert.alert(
                "Account Deleted",
                "Your account and all associated data have been permanently deleted.",
                [
                    {
                        text: "OK",
                        onPress: async () => {
                            await logout();
                            router.replace("/login");
                        }
                    }
                ]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete account. Please verify your password.");
        } finally {
            setIsDeleting(false);
            setDeletePassword("");
            setShowDeleteConfirm(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Confirmation Modal for Native */}
            {showConfirm && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Sign Out</Text>
                        <Text style={styles.modalText}>Are you sure you want to sign out?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowConfirm(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={performLogout}
                            >
                                <Text style={styles.confirmButtonText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Account Deletion Confirmation Modal */}
            {showDeleteConfirm && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Delete Account</Text>
                        <Text style={styles.modalText}>
                            Are you absolutely sure? This action is permanent and will delete all your likes, watch history, and active subscription.
                        </Text>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter password to confirm"
                            placeholderTextColor="#666"
                            secureTextEntry
                            value={deletePassword}
                            onChangeText={setDeletePassword}
                            editable={!isDeleting}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    if (!isDeleting) {
                                        setShowDeleteConfirm(false);
                                        setDeletePassword("");
                                    }
                                }}
                                disabled={isDeleting}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>App Settings</Text>
                {/* Spacer to center title */}
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.settingsSection}>
                    <TouchableOpacity style={styles.settingsItem} onPress={() => {
                        Alert.alert('Coming Soon', 'Push notification preferences will be available in a future update.');
                    }}>
                        <View style={styles.settingsLeft}>
                            <Bell color="#808080" size={20} />
                            <Text style={styles.settingsText}>Notifications</Text>
                        </View>
                        <ChevronRight color="#808080" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsItem} onPress={() => Linking.openURL('https://cineswipe-admin.vercel.app/privacy')}>
                        <View style={styles.settingsLeft}>
                            <Shield color="#808080" size={20} />
                            <Text style={styles.settingsText}>Privacy & Security</Text>
                        </View>
                        <ChevronRight color="#808080" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsItem} onPress={() => router.push('/about')}>
                        <View style={styles.settingsLeft}>
                            <Info color="#808080" size={20} />
                            <Text style={styles.settingsText}>About</Text>
                        </View>
                        <ChevronRight color="#808080" size={20} />
                    </TouchableOpacity>
                </View>

                {/* Sign Out Button */}
                <View style={styles.signOutContainer}>
                    <TouchableOpacity
                        style={styles.signOutItem}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingsLeft}>
                            <LogOut color="#E50914" size={20} />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={styles.dangerSection}>
                    <Text style={styles.sectionTitle}>Danger Zone</Text>
                    <TouchableOpacity
                        style={styles.deleteAccountItem}
                        onPress={() => setShowDeleteConfirm(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingsLeft}>
                            <Shield color="#E50914" size={20} />
                            <Text style={styles.deleteAccountText}>Delete Account</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>CineSwipe v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    settingsSection: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    settingsItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    settingsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 12,
    },
    signOutContainer: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    signOutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    signOutText: {
        color: '#E50914',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    versionText: {
        color: '#555',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    modalCard: {
        backgroundColor: '#1a1a1a',
        padding: 24,
        borderRadius: 8,
        width: '80%',
        maxWidth: 320,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    modalText: {
        color: '#a0a0a0',
        fontSize: 14,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
        backgroundColor: '#333',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    confirmButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    dangerSection: {
        paddingHorizontal: 16,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: 20,
    },
    sectionTitle: {
        color: '#555',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    deleteAccountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    deleteAccountText: {
        color: '#E50914',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    passwordInput: {
        backgroundColor: '#222',
        color: '#fff',
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#444',
    },
});
