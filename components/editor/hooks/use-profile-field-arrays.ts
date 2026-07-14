'use client';

import { useCallback } from 'react';
import { useFieldArray, type Control } from 'react-hook-form';

import {
  createEmptyAwardEntry,
  createEmptyCertificationEntry,
  createEmptyEducationEntry,
  createEmptyExhibitionEntry,
  createEmptyExperienceEntry,
  createEmptyProjectEntry,
  createEmptyVolunteeringEntry,
  type ProfileUpdateFormValues,
} from '@/lib/profile/editor';
import type {
  AwardEntry,
  CertificationEntry,
  EducationEntry,
  ExhibitionEntry,
  ExperienceEntry,
  ProjectEntry,
  VolunteeringEntry,
} from '@/lib/profile/domain';

type ProfileFieldArrayController<TEntry> = {
  fields: Array<TEntry & { fieldKey: string }>;
  add: () => void;
  remove: (index: number) => void;
  move: (oldIndex: number, newIndex: number) => void;
  replace: (entries: TEntry[]) => void;
};

export type ProfileFieldArrays = {
  experience: ProfileFieldArrayController<ExperienceEntry>;
  education: ProfileFieldArrayController<EducationEntry>;
  projects: ProfileFieldArrayController<ProjectEntry>;
  certifications: ProfileFieldArrayController<CertificationEntry>;
  volunteering: ProfileFieldArrayController<VolunteeringEntry>;
  exhibitions: ProfileFieldArrayController<ExhibitionEntry>;
  awards: ProfileFieldArrayController<AwardEntry>;
};

export function useProfileFieldArrays(
  control: Control<ProfileUpdateFormValues>,
  createId: () => string
): ProfileFieldArrays {
  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperienceField,
    move: moveExperienceField,
    replace: replaceExperience,
  } = useFieldArray<ProfileUpdateFormValues, 'experience', 'fieldKey'>({
    control,
    name: 'experience',
    keyName: 'fieldKey',
  });
  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducationField,
    move: moveEducationField,
    replace: replaceEducation,
  } = useFieldArray<ProfileUpdateFormValues, 'education', 'fieldKey'>({
    control,
    name: 'education',
    keyName: 'fieldKey',
  });
  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProjectField,
    move: moveProjectField,
    replace: replaceProjects,
  } = useFieldArray<ProfileUpdateFormValues, 'projects', 'fieldKey'>({
    control,
    name: 'projects',
    keyName: 'fieldKey',
  });
  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertificationField,
    move: moveCertificationField,
    replace: replaceCertifications,
  } = useFieldArray<ProfileUpdateFormValues, 'certifications', 'fieldKey'>({
    control,
    name: 'certifications',
    keyName: 'fieldKey',
  });
  const {
    fields: volunteeringFields,
    append: appendVolunteering,
    remove: removeVolunteeringField,
    move: moveVolunteeringField,
    replace: replaceVolunteering,
  } = useFieldArray<ProfileUpdateFormValues, 'volunteering', 'fieldKey'>({
    control,
    name: 'volunteering',
    keyName: 'fieldKey',
  });
  const {
    fields: exhibitionFields,
    append: appendExhibition,
    remove: removeExhibitionField,
    move: moveExhibitionField,
    replace: replaceExhibitions,
  } = useFieldArray<ProfileUpdateFormValues, 'exhibitions', 'fieldKey'>({
    control,
    name: 'exhibitions',
    keyName: 'fieldKey',
  });
  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAwardField,
    move: moveAwardField,
    replace: replaceAwards,
  } = useFieldArray<ProfileUpdateFormValues, 'awards', 'fieldKey'>({
    control,
    name: 'awards',
    keyName: 'fieldKey',
  });

  const addExperience = useCallback(() => {
    appendExperience(createEmptyExperienceEntry(createId()));
  }, [appendExperience, createId]);
  const removeExperience = useCallback(
    (index: number) => removeExperienceField(index),
    [removeExperienceField]
  );
  const moveExperience = useCallback(
    (oldIndex: number, newIndex: number) =>
      moveExperienceField(oldIndex, newIndex),
    [moveExperienceField]
  );

  const addEducation = useCallback(() => {
    appendEducation(createEmptyEducationEntry(createId()));
  }, [appendEducation, createId]);
  const removeEducation = useCallback(
    (index: number) => removeEducationField(index),
    [removeEducationField]
  );
  const moveEducation = useCallback(
    (oldIndex: number, newIndex: number) =>
      moveEducationField(oldIndex, newIndex),
    [moveEducationField]
  );

  const addProject = useCallback(() => {
    appendProject(createEmptyProjectEntry(createId()));
  }, [appendProject, createId]);
  const removeProject = useCallback(
    (index: number) => removeProjectField(index),
    [removeProjectField]
  );
  const moveProject = useCallback(
    (oldIndex: number, newIndex: number) =>
      moveProjectField(oldIndex, newIndex),
    [moveProjectField]
  );

  const addCertification = useCallback(() => {
    appendCertification(createEmptyCertificationEntry(createId()));
  }, [appendCertification, createId]);
  const removeCertification = useCallback(
    (index: number) => removeCertificationField(index),
    [removeCertificationField]
  );
  const moveCertification = useCallback(
    (oldIndex: number, newIndex: number) =>
      moveCertificationField(oldIndex, newIndex),
    [moveCertificationField]
  );

  const addVolunteering = useCallback(() => {
    appendVolunteering(createEmptyVolunteeringEntry(createId()));
  }, [appendVolunteering, createId]);
  const removeVolunteering = useCallback(
    (index: number) => removeVolunteeringField(index),
    [removeVolunteeringField]
  );
  const moveVolunteering = useCallback(
    (oldIndex: number, newIndex: number) =>
      moveVolunteeringField(oldIndex, newIndex),
    [moveVolunteeringField]
  );

  const addExhibition = useCallback(() => {
    appendExhibition(createEmptyExhibitionEntry(createId()));
  }, [appendExhibition, createId]);
  const removeExhibition = useCallback(
    (index: number) => removeExhibitionField(index),
    [removeExhibitionField]
  );
  const moveExhibition = useCallback(
    (oldIndex: number, newIndex: number) =>
      moveExhibitionField(oldIndex, newIndex),
    [moveExhibitionField]
  );

  const addAward = useCallback(() => {
    appendAward(createEmptyAwardEntry(createId()));
  }, [appendAward, createId]);
  const removeAward = useCallback(
    (index: number) => removeAwardField(index),
    [removeAwardField]
  );
  const moveAward = useCallback(
    (oldIndex: number, newIndex: number) => moveAwardField(oldIndex, newIndex),
    [moveAwardField]
  );

  return {
    experience: {
      fields: experienceFields,
      add: addExperience,
      remove: removeExperience,
      move: moveExperience,
      replace: replaceExperience,
    },
    education: {
      fields: educationFields,
      add: addEducation,
      remove: removeEducation,
      move: moveEducation,
      replace: replaceEducation,
    },
    projects: {
      fields: projectFields,
      add: addProject,
      remove: removeProject,
      move: moveProject,
      replace: replaceProjects,
    },
    certifications: {
      fields: certificationFields,
      add: addCertification,
      remove: removeCertification,
      move: moveCertification,
      replace: replaceCertifications,
    },
    volunteering: {
      fields: volunteeringFields,
      add: addVolunteering,
      remove: removeVolunteering,
      move: moveVolunteering,
      replace: replaceVolunteering,
    },
    exhibitions: {
      fields: exhibitionFields,
      add: addExhibition,
      remove: removeExhibition,
      move: moveExhibition,
      replace: replaceExhibitions,
    },
    awards: {
      fields: awardFields,
      add: addAward,
      remove: removeAward,
      move: moveAward,
      replace: replaceAwards,
    },
  };
}
