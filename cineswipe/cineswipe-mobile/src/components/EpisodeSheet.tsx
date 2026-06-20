import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Animated, PanResponder, Image, Dimensions } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Clip } from '../types';

interface EpisodeSheetProps {
    visible: boolean;
    onClose: () => void;
    clips: Clip[];
    activeIndex: number;
    watchedIndices: Set<number>;
    onSelectClip: (index: number) => void;
    movieTitle: string;
    movieThumbnail: string;
    isLandscape: boolean;
    freeClipLimit: number;
    isPremium: boolean;
}

export function EpisodeSheet({
    visible,
    onClose,
    clips,
    activeIndex,
    watchedIndices,
    onSelectClip,
    movieTitle,
    movieThumbnail,
    isLandscape,
    freeClipLimit,
    isPremium
}: EpisodeSheetProps) {
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, slideAnim]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderRelease: (e, gestureState) => {
                if (gestureState.dy > 50) {
                    onClose();
                }
            },
        })
    ).current;

    if (!visible) return null;

    const renderItem = ({ item, index }: { item: Clip, index: number }) => {
        const isCurrent = index === activeIndex;
        const isWatched = watchedIndices.has(index);
        const isLocked = !isPremium && index >= freeClipLimit;

        return (
            <TouchableOpacity
                style={[
                    styles.clipItem, 
                    isCurrent && styles.clipItemCurrent,
                    isCurrent && isPremium && { backgroundColor: 'rgba(212, 175, 55, 0.1)' }
                ]}
                onPress={() => onSelectClip(index)}
            >
                <Image source={{ uri: movieThumbnail }} style={styles.thumbnail} blurRadius={isLocked ? 10 : 0} />
                <View style={styles.clipInfo}>
                    <Text style={[
                        styles.clipTitle, 
                        isCurrent && styles.textCurrent,
                        isCurrent && isPremium && { color: '#D4AF37' }
                    ]}>
                        Clip {index + 1}
                    </Text>
                    <Text style={styles.clipDuration}>
                        {isLocked ? '🔒 Premium' : `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`}
                    </Text>
                </View>
                {isCurrent ? (
                    <Text style={[styles.nowPlayingText, isPremium && { color: '#D4AF37' }]}>Now Playing</Text>
                ) : isWatched ? (
                    <Check color="#ccc" size={20} />
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <Modal 
            transparent 
            visible={visible} 
            animationType="none" 
            onRequestClose={onClose}
            supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <Animated.View
                    style={[
                        isLandscape ? styles.sidePanel : styles.bottomSheet,
                        {
                            transform: [
                                {
                                    [isLandscape ? 'translateX' : 'translateY']: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [isLandscape ? Dimensions.get('window').width * 0.4 : 800, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
                    <View style={styles.header} {...(isLandscape ? {} : panResponder.panHandlers)}>
                        {!isLandscape && <View style={styles.dragHandle} />}
                        <View style={styles.headerTitleRow}>
                            <Text style={styles.movieTitle}>{movieTitle}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X color="white" size={24} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={clips}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '60%',
        paddingBottom: 20,
    },
    sidePanel: {
        backgroundColor: '#1a1a1a',
        width: '40%',
        height: '100%',
        position: 'absolute',
        right: 0,
        top: 0,
        paddingBottom: 20,
        borderLeftWidth: 1,
        borderLeftColor: '#333',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#666',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    movieTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    clipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    clipItemCurrent: {
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginHorizontal: -8,
        borderBottomWidth: 0,
    },
    thumbnail: {
        width: 80,
        height: 45,
        borderRadius: 4,
        backgroundColor: '#333',
        marginRight: 12,
    },
    clipInfo: {
        flex: 1,
    },
    clipTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    textCurrent: {
        color: '#E50914',
    },
    clipDuration: {
        color: '#999',
        fontSize: 12,
        marginTop: 4,
    },
    nowPlayingText: {
        color: '#E50914',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
