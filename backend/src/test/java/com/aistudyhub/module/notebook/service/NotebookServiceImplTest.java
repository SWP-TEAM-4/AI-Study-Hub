package com.aistudyhub.module.notebook.service;

import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.notebook.dto.NotebookResponse;
import com.aistudyhub.module.notebook.dto.UpdateNotebookRequest;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotebookServiceImplTest {

    @Mock
    private NotebookRepository notebookRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotebookServiceImpl notebookService;

    @Test
    void updateNotebookKeepsRequiredSubjectAndUsesRequestedSubject() {
        User owner = User.builder().id(5L).build();
        Subject oldSubject = Subject.builder().id(1L).code("OLD").name("Old subject").build();
        Subject newSubject = Subject.builder().id(7L).code("SWR302").name("Software Requirements").build();
        Notebook notebook = Notebook.builder()
                .id(2L)
                .user(owner)
                .subject(oldSubject)
                .title("Old title")
                .build();
        UpdateNotebookRequest request = new UpdateNotebookRequest();
        request.setTitle("Updated title");
        request.setSubjectId(7L);

        when(notebookRepository.findByIdAndUserId(2L, 5L)).thenReturn(Optional.of(notebook));
        when(subjectRepository.findById(7L)).thenReturn(Optional.of(newSubject));
        when(notebookRepository.save(any(Notebook.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotebookResponse response = notebookService.updateNotebook(2L, 5L, request);

        assertThat(response.getTitle()).isEqualTo("Updated title");
        assertThat(response.getSubjectId()).isEqualTo(7L);
        assertThat(notebook.getSubject()).isSameAs(newSubject);
        verify(notebookRepository).save(notebook);
    }
}
