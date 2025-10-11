import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {recommendationsAPI, gamificationAPI} from '../services/api';

const HomeScreen = ({navigation}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recsRes, trendingRes, statsRes] = await Promise.all([
        recommendationsAPI.get(5),
        recommendationsAPI.getTrending(5),
        gamificationAPI.getStats(),
      ]);

      setRecommendations(recsRes.data.data || []);
      setTrending(trendingRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Stats Section */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Level {stats.level || 1}</Text>
              <Text style={styles.statLabel}>Your Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.badges || 0}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>
      )}

      {/* Recommended Courses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        {recommendations.length > 0 ? (
          recommendations.map(rec => (
            <TouchableOpacity key={rec._id} style={styles.courseCard}>
              <Text style={styles.courseTitle}>
                {rec.course?.title?.en || 'Course'}
              </Text>
              <Text style={styles.courseDescription}>
                {rec.course?.shortDescription?.en || ''}
              </Text>
              <Text style={styles.matchScore}>
                {Math.round(rec.score)}% match
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No recommendations available</Text>
        )}
      </View>

      {/* Trending Courses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending Now</Text>
        {trending.length > 0 ? (
          trending.map(course => (
            <TouchableOpacity key={course._id} style={styles.courseCard}>
              <Text style={styles.courseTitle}>
                {course.title?.en || 'Course'}
              </Text>
              <Text style={styles.courseDescription}>
                {course.shortDescription?.en || ''}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No trending courses</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: '#4CAF50',
    padding: 20,
    margin: 15,
    borderRadius: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
  },
  matchScore: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default HomeScreen;
