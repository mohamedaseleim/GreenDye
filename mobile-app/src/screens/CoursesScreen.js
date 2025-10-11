import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {coursesAPI} from '../services/api';

const CoursesScreen = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await coursesAPI.getAll({page: 1, limit: 20});
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCourses();
      return;
    }

    setLoading(true);
    try {
      const response = await coursesAPI.search(searchQuery);
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error searching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCourseItem = ({item}) => (
    <TouchableOpacity style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseTitle}>{item.title?.en || 'Course'}</Text>
        <Text style={styles.coursePrice}>
          {item.price > 0 ? `$${item.price}` : 'Free'}
        </Text>
      </View>
      
      <Text style={styles.courseDescription} numberOfLines={2}>
        {item.shortDescription?.en || item.description?.en || ''}
      </Text>
      
      <View style={styles.courseFooter}>
        <View style={styles.courseInfo}>
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.courseInfoText}>
            {item.instructor?.name || 'Instructor'}
          </Text>
        </View>
        <View style={styles.courseInfo}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.courseInfoText}>{item.duration}h</Text>
        </View>
        <View style={styles.courseInfo}>
          <Icon name="star" size={16} color="#FFC107" />
          <Text style={styles.courseInfoText}>
            {item.rating?.toFixed(1) || 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && courses.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadCourses();
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No courses found</Text>
        }
      />
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  coursePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseInfoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default CoursesScreen;
